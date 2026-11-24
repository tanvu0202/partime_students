package com.gr7.backend.service;

import com.gr7.backend.dto.JobRequest;
import com.gr7.backend.dto.JobResponse;
import com.gr7.backend.dto.MyJobResponse;
import com.gr7.backend.entity.ApplicationStatus;
import com.gr7.backend.entity.EmployerProfile;
import com.gr7.backend.entity.JobPost;
import com.gr7.backend.entity.JobStatus;
import com.gr7.backend.entity.NotificationType;
import com.gr7.backend.entity.StudentProfile;
import com.gr7.backend.entity.UserStatus;
import com.gr7.backend.entity.WorkTimeSlots;
import com.gr7.backend.exception.ApiException;
import com.gr7.backend.repository.ApplicationRepository;
import com.gr7.backend.repository.EmployerProfileRepository;
import com.gr7.backend.repository.JobPostRepository;
import com.gr7.backend.repository.StudentProfileRepository;
import com.gr7.backend.repository.UserRepository;
import com.gr7.backend.entity.Role;
import com.gr7.backend.entity.User;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Đăng, sửa, xóa, đóng tin (PB-05, PB-06), cập nhật trạng thái công việc (PB-12).
 * Mọi thao tác sửa/xóa/đóng đều kiểm tra tin thuộc nhà tuyển dụng đang đăng nhập, khác -> 403.
 */
@Service
public class JobService {

    private final JobPostRepository jobs;
    private final EmployerProfileRepository employers;
    private final ApplicationRepository applications;
    private final NotificationService notifications;
    private final StudentProfileRepository students;
    private final UserRepository users;

    public JobService(JobPostRepository jobs, EmployerProfileRepository employers,
                      ApplicationRepository applications, NotificationService notifications,
                      StudentProfileRepository students, UserRepository users) {
        this.jobs = jobs;
        this.employers = employers;
        this.applications = applications;
        this.notifications = notifications;
        this.students = students;
        this.users = users;
    }

    @Transactional
    public JobResponse create(Long userId, JobRequest req) {
        JobPost j = new JobPost();
        j.setEmployer(employerOf(userId));
        apply(j, req);
        j.setStatus(JobStatus.PENDING);
        JobPost saved = jobs.save(j);
        notifyAdminsNewJob(saved, false);
        return JobResponse.from(saved);
    }

    /** Gửi thông báo cho toàn bộ quản trị viên đang hoạt động khi có tin mới/gửi duyệt lại. */
    private void notifyAdminsNewJob(JobPost job, boolean resubmit) {
        String prefix = resubmit ? "Tin được chỉnh sửa gửi duyệt lại: " : "Tin tuyển dụng mới chờ duyệt: ";
        String msg = prefix + NotificationService.quote(job.getTitle())
                + " (" + job.getEmployer().getCompanyName() + ")";
        String link = "/admin?tab=jobs&filter=PENDING&jobId=" + job.getId();
        for (User admin : users.findByRoleAndStatus(Role.ADMIN, UserStatus.ACTIVE)) {
            notifications.create(admin, NotificationType.JOB_PENDING_APPROVAL, msg, link);
        }
    }

    /** Đổi visibility sang public để AdminJobService gọi ngay khi duyệt tin. */
    public void notifyMatchingStudents(JobPost job) {
        int jobMask = job.getShiftSlots() & WorkTimeSlots.ALL;
        if (jobMask == 0) return;
        String msg = "Có việc mới phù hợp lịch rảnh: " + NotificationService.quote(job.getTitle());
        String link = "/jobs/" + job.getId();
        for (StudentProfile s : students.findMatchingForJob(jobMask)) {
            notifications.create(s.getUser(), NotificationType.MATCHING_JOB, msg, link);
        }
    }
    @Transactional
    public JobResponse update(Long userId, Long jobId, JobRequest req) {
        JobPost j = ownedJob(userId, jobId);
        if (j.getStatus() == JobStatus.CLOSED || j.getStatus() == JobStatus.COMPLETED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tin đã đóng hoặc đã hoàn thành, không sửa được nữa");
        }
        apply(j, req);
        if (j.getStatus() == JobStatus.REJECTED) {
            j.setStatus(JobStatus.PENDING);
            j.setRejectReason(null);
            notifyAdminsNewJob(j, true);
        }
        return JobResponse.from(j);
    }

    /** Xóa hẳn chỉ khi chưa có ai ứng tuyển; đã có đơn thì nên đóng tin để giữ lịch sử. */
    @Transactional
    public void delete(Long userId, Long jobId) {
        JobPost j = ownedJob(userId, jobId);
        if (applications.countByJobId(jobId) > 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Tin đã có đơn ứng tuyển, hãy đóng tin thay vì xóa");
        }
        jobs.delete(j);
    }

    @Transactional
    public JobResponse close(Long userId, Long jobId) {
        JobPost j = ownedJob(userId, jobId);
        if (j.getStatus() == JobStatus.CLOSED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tin này đã được đóng trước đó");
        }
        // Bảng 4.13: chỉ tin Đang tuyển hoặc Đã nhận người mới chuyển sang Đã đóng
        if (j.getStatus() == JobStatus.PENDING || j.getStatus() == JobStatus.REJECTED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tin chưa được duyệt, hãy xóa tin nếu không cần đăng nữa");
        }
        if (j.getStatus() == JobStatus.COMPLETED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tin đã hoàn thành, không đóng được nữa");
        }
        j.setStatus(JobStatus.CLOSED);
        return JobResponse.from(j);
    }

    /**
     * Cập nhật trạng thái công việc (PB-12): chỉ OPEN → FILLED → COMPLETED.
     * Chuyển sang "Đã đủ người" cần có ít nhất 1 ứng viên đã được nhận.
     */
    @Transactional
    public JobResponse changeStatus(Long userId, Long jobId, JobStatus next) {
        JobPost j = ownedJob(userId, jobId);
        if (!j.getStatus().canMoveTo(next)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Chỉ được chuyển lần lượt: Đang tuyển → Đã đủ người → Hoàn thành");
        }
        if (next == JobStatus.FILLED && applications.countByJobIdAndStatus(jobId, ApplicationStatus.ACCEPTED) == 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tin chưa nhận ứng viên nào, chưa thể chuyển sang Đã đủ người");
        }
        j.setStatus(next);
        // PB-14: báo cho các sinh viên đã được nhận
        String msg = next == JobStatus.FILLED
                ? "Tin " + NotificationService.quote(j.getTitle()) + " đã đủ người, công việc sắp bắt đầu"
                : "Công việc " + NotificationService.quote(j.getTitle()) + " đã hoàn thành, hãy đánh giá nhà tuyển dụng";
        applications.findByJobIdAndStatus(jobId, ApplicationStatus.ACCEPTED).forEach(a ->
                notifications.create(a.getStudent().getUser(), NotificationType.JOB_STATUS_CHANGED, msg,
                        "/student/applications"));
        return JobResponse.from(j);
    }

    @Transactional(readOnly = true)
    public List<MyJobResponse> listMine(Long userId) {
        EmployerProfile e = employerOf(userId);
        return jobs.findByEmployerIdOrderByCreatedAtDesc(e.getId()).stream()
                .map(j -> MyJobResponse.from(j,
                        applications.countByJobId(j.getId()),
                        applications.countByJobIdAndStatus(j.getId(), ApplicationStatus.PENDING)))
                .toList();
    }

    /** Lấy tin của chính NTD đang đăng nhập (dùng cho trang sửa tin). */
    @Transactional(readOnly = true)
    public JobResponse getMine(Long userId, Long jobId) {
        return JobResponse.from(ownedJob(userId, jobId));
    }

    private void apply(JobPost j, JobRequest req) {
        if (req.salaryMin() != null && req.salaryMax() != null && req.salaryMin().compareTo(req.salaryMax()) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Lương tối thiểu không được lớn hơn lương tối đa");
        }
        j.setTitle(req.title().trim());
        j.setDescription(req.description().trim());
        j.setCategory(req.category().trim());
        j.setLocation(req.location().trim());
        j.setSalaryMin(req.salaryMin());
        j.setSalaryMax(req.salaryMax());
        j.setSalaryUnit(req.salaryUnit());
        j.setWorkTime(req.workTime().trim());
        j.setSlots(req.slots());
    }

    private EmployerProfile employerOf(Long userId) {
        return employers.findByUserId(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ nhà tuyển dụng"));
    }

    /** Tin phải tồn tại (404) và thuộc NTD đang đăng nhập (403). Dùng chung cho Hải ở phần duyệt ứng viên. */
    JobPost ownedJob(Long userId, Long jobId) {
        JobPost j = jobs.findById(jobId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tin tuyển dụng"));
        if (!j.getEmployer().getUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Bạn không có quyền thao tác trên tin của người khác");
        }
        return j;
    }

    
}
