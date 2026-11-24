package com.gr7.backend.service;

import com.gr7.backend.dto.HandleReportResponse;
import com.gr7.backend.dto.JobReportRequest;
import com.gr7.backend.dto.JobReportResponse;
import com.gr7.backend.dto.ReportedJobResponse;
import com.gr7.backend.entity.JobPost;
import com.gr7.backend.entity.JobReport;
import com.gr7.backend.entity.JobStatus;
import com.gr7.backend.entity.NotificationType;
import com.gr7.backend.entity.ReportReason;
import com.gr7.backend.entity.ReportStatus;
import com.gr7.backend.entity.Role;
import com.gr7.backend.entity.StudentProfile;
import com.gr7.backend.entity.User;
import com.gr7.backend.entity.UserStatus;
import com.gr7.backend.exception.ApiException;
import com.gr7.backend.repository.JobPostRepository;
import com.gr7.backend.repository.JobReportRepository;
import com.gr7.backend.repository.StudentProfileRepository;
import com.gr7.backend.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Báo cáo tin đáng ngờ (PB-21, FR-24).
 * Sinh viên báo cáo một tin một lần; quản trị viên xử lý cả nhóm báo cáo đang chờ của tin đó:
 * gỡ tin (dùng chức năng ẩn tin của PB-16) hoặc bỏ qua. Người báo cáo nhận thông báo kết quả.
 */
@Service
public class JobReportService {

    private final JobReportRepository reports;
    private final JobPostRepository jobs;
    private final StudentProfileRepository students;
    private final UserRepository users;
    private final NotificationService notifications;
    private final AdminJobService adminJobs;

    public JobReportService(JobReportRepository reports, JobPostRepository jobs, StudentProfileRepository students,
                            UserRepository users, NotificationService notifications, AdminJobService adminJobs) {
        this.reports = reports;
        this.jobs = jobs;
        this.students = students;
        this.users = users;
        this.notifications = notifications;
        this.adminJobs = adminJobs;
    }

    /** 201 báo cáo mới (PENDING); 400 lý do sai; 404 tin không tồn tại hoặc chưa hiển thị; 409 đã báo cáo tin này. */
    @Transactional
    public JobReportResponse report(Long userId, Long jobId, JobReportRequest req) {
        StudentProfile s = students.findByUserId(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ sinh viên"));
        JobPost j = jobs.findById(jobId)
                .filter(x -> !x.isHidden() && x.getStatus() != JobStatus.PENDING && x.getStatus() != JobStatus.REJECTED)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tin tuyển dụng"));
        ReportReason reason = parseReason(req.reason());
        String description = req.description() == null || req.description().isBlank() ? null : req.description().trim();
        if (reason == ReportReason.OTHER && description == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vui lòng mô tả thêm khi chọn Lý do khác");
        }
        if (reports.existsByJobIdAndReporterId(jobId, s.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Bạn đã báo cáo tin này");
        }
        JobReport saved;
        try {
            saved = reports.saveAndFlush(new JobReport(j, s, reason, description));
        } catch (DataIntegrityViolationException e) {
            // Hai yêu cầu gửi cùng lúc: khóa UNIQUE(job_id, reporter_id) chặn lại
            throw new ApiException(HttpStatus.CONFLICT, "Bạn đã báo cáo tin này");
        }
        String msg = "Tin " + NotificationService.quote(j.getTitle()) + " bị báo cáo: " + reason.label();
        for (User admin : users.findByRoleAndStatus(Role.ADMIN, UserStatus.ACTIVE)) {
            notifications.create(admin, NotificationType.JOB_REPORTED, msg, "/admin?tab=reports");
        }
        return JobReportResponse.from(saved);
    }

    /**
     * Danh sách cho quản trị viên, gom theo tin và trạng thái báo cáo.
     * Sắp xếp: tin bị báo cáo nhiều lượt trước, cùng số lượt thì báo cáo mới hơn trước.
     */
    @Transactional(readOnly = true)
    public List<ReportedJobResponse> adminList(String status) {
        ReportStatus st = parseStatus(status);
        Map<String, List<JobReport>> groups = reports.findAllByOrderByCreatedAtDesc().stream()
                .filter(r -> st == null || r.getStatus() == st)
                .collect(Collectors.groupingBy(r -> r.getJob().getId() + ":" + r.getStatus(),
                        LinkedHashMap::new, Collectors.toList()));
        List<ReportedJobResponse> out = new ArrayList<>();
        for (List<JobReport> g : groups.values()) {
            JobReport latest = g.get(0);
            JobPost j = latest.getJob();
            ReportReason main = g.stream()
                    .collect(Collectors.groupingBy(JobReport::getReason, Collectors.counting()))
                    .entrySet().stream()
                    .max(Map.Entry.<ReportReason, Long>comparingByValue()
                            .thenComparing(e -> -e.getKey().ordinal()))
                    .map(Map.Entry::getKey).orElse(latest.getReason());
            out.add(new ReportedJobResponse(latest.getId(), j.getId(), j.getTitle(), j.getEmployer().getCompanyName(),
                    j.isHidden(), latest.getStatus().name(), g.size(), main.name(), main.label(),
                    latest.getCreatedAt(), g.stream().map(JobReportResponse::from).toList()));
        }
        out.sort(Comparator.comparingInt(ReportedJobResponse::reportCount).reversed()
                .thenComparing(ReportedJobResponse::latestAt, Comparator.reverseOrder()));
        return out;
    }

    /**
     * Xử lý báo cáo {id} cùng mọi báo cáo đang chờ khác của tin đó.
     * HIDE_JOB: ẩn tin (nếu chưa ẩn) -> RESOLVED; DISMISS: giữ tin -> DISMISSED.
     * 400 cách xử lý sai; 404 không có báo cáo; 409 báo cáo đã được xử lý.
     */
    @Transactional
    public HandleReportResponse handle(Long reportId, String action) {
        JobReport r = reports.findById(reportId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy báo cáo"));
        boolean hide = parseAction(action);
        if (r.getStatus() != ReportStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "Báo cáo này đã được xử lý");
        }
        JobPost j = r.getJob();
        if (hide && !j.isHidden()) {
            adminJobs.hide(j.getId());   // báo nhà tuyển dụng như khi ẩn tin ở tab Tin đăng
        }
        ReportStatus result = hide ? ReportStatus.RESOLVED : ReportStatus.DISMISSED;
        String msg = hide
                ? "Tin " + NotificationService.quote(j.getTitle()) + " bạn báo cáo đã bị gỡ. Cảm ơn bạn đã giúp cộng đồng an toàn hơn"
                : "Báo cáo tin " + NotificationService.quote(j.getTitle()) + " đã được xem xét, chưa thấy dấu hiệu vi phạm";
        String link = hide ? "/" : "/jobs/" + j.getId();
        List<JobReport> pending = reports.findByJobIdAndStatus(j.getId(), ReportStatus.PENDING);
        for (JobReport p : pending) {
            p.handle(result);
            notifications.create(p.getReporter().getUser(), NotificationType.REPORT_HANDLED, msg, link);
        }
        return new HandleReportResponse(r.getId(), j.getId(), result.name(), pending.size(), j.isHidden());
    }

    private static ReportReason parseReason(String s) {
        try {
            return ReportReason.valueOf(s.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Lý do báo cáo không hợp lệ");
        }
    }

    private static ReportStatus parseStatus(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return ReportStatus.valueOf(s.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Trạng thái báo cáo không hợp lệ");
        }
    }

    /** true = HIDE_JOB, false = DISMISS. */
    private static boolean parseAction(String s) {
        String a = s == null ? "" : s.trim().toUpperCase(Locale.ROOT);
        if (a.equals("HIDE_JOB")) return true;
        if (a.equals("DISMISS")) return false;
        throw new ApiException(HttpStatus.BAD_REQUEST, "Cách xử lý không hợp lệ (HIDE_JOB hoặc DISMISS)");
    }
}
