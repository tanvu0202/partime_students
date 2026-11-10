package com.gr7.backend.service;

import com.gr7.backend.dto.JobRequest;
import com.gr7.backend.dto.JobResponse;
import com.gr7.backend.dto.MyJobResponse;
import com.gr7.backend.entity.ApplicationStatus;
import com.gr7.backend.entity.EmployerProfile;
import com.gr7.backend.entity.JobPost;
import com.gr7.backend.entity.JobStatus;
import com.gr7.backend.exception.ApiException;
import com.gr7.backend.repository.ApplicationRepository;
import com.gr7.backend.repository.EmployerProfileRepository;
import com.gr7.backend.repository.JobPostRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Đăng, sửa, xóa, đóng tin (PB-05, PB-06).
 * Mọi thao tác sửa/xóa/đóng đều kiểm tra tin thuộc nhà tuyển dụng đang đăng nhập, khác -> 403.
 */
@Service
public class JobService {

    private final JobPostRepository jobs;
    private final EmployerProfileRepository employers;
    private final ApplicationRepository applications;

    public JobService(JobPostRepository jobs, EmployerProfileRepository employers, ApplicationRepository applications) {
        this.jobs = jobs;
        this.employers = employers;
        this.applications = applications;
    }

    @Transactional
    public JobResponse create(Long userId, JobRequest req) {
        JobPost j = new JobPost();
        j.setEmployer(employerOf(userId));
        apply(j, req);
        j.setStatus(JobStatus.OPEN);
        return JobResponse.from(jobs.save(j));
    }

    @Transactional
    public JobResponse update(Long userId, Long jobId, JobRequest req) {
        JobPost j = ownedJob(userId, jobId);
        if (j.getStatus() == JobStatus.CLOSED || j.getStatus() == JobStatus.COMPLETED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tin đã đóng hoặc đã hoàn thành, không sửa được nữa");
        }
        apply(j, req);
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
        j.setStatus(JobStatus.CLOSED);
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
