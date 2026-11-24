package com.gr7.backend.service;

import com.gr7.backend.dto.ApplicantResponse;
import com.gr7.backend.entity.Application;
import com.gr7.backend.entity.ApplicationStatus;
import com.gr7.backend.entity.JobPost;
import com.gr7.backend.entity.NotificationType;
import com.gr7.backend.exception.ApiException;
import com.gr7.backend.repository.ApplicationRepository;
import com.gr7.backend.repository.JobPostRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Nhà tuyển dụng xem ứng viên, duyệt / từ chối (PB-11). Chỉ chủ tin mới thao tác được. */
@Service
public class ApplicantService {

    private final ApplicationRepository applications;
    private final JobPostRepository jobs;
    private final NotificationService notifications;
    private final ApplicationMailService mails;

    public ApplicantService(ApplicationRepository applications, JobPostRepository jobs,
                            NotificationService notifications, ApplicationMailService mails) {
        this.applications = applications;
        this.jobs = jobs;
        this.notifications = notifications;
        this.mails = mails;
    }

    @Transactional(readOnly = true)
    public List<ApplicantResponse> listForJob(Long userId, Long jobId) {
        JobPost j = jobs.findById(jobId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tin tuyển dụng"));
        checkOwner(j, userId);
        return applications.findByJobIdOrderByAppliedAtDesc(jobId).stream()
                .map(ApplicantResponse::from)
                .toList();
    }

    /** Chỉ đổi đơn đang PENDING sang ACCEPTED hoặc REJECTED. */
    @Transactional
    public ApplicantResponse updateStatus(Long userId, Long applicationId, ApplicationStatus status) {
        if (status != ApplicationStatus.ACCEPTED && status != ApplicationStatus.REJECTED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chỉ được chọn ACCEPTED (duyệt) hoặc REJECTED (từ chối)");
        }
        Application a = applications.findById(applicationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn ứng tuyển"));
        checkOwner(a.getJob(), userId);
        if (a.getStatus() != ApplicationStatus.PENDING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Đơn này đã được xử lý trước đó");
        }
        a.setStatus(status);
        // PB-14: báo kết quả cho sinh viên
        boolean ok = status == ApplicationStatus.ACCEPTED;
        notifications.create(a.getStudent().getUser(),
                ok ? NotificationType.APPLICATION_ACCEPTED : NotificationType.APPLICATION_REJECTED,
                (ok ? "Chúc mừng, bạn đã được nhận vào tin " : "Đơn của bạn chưa phù hợp với tin ")
                        + NotificationService.quote(a.getJob().getTitle()),
                "/student/applications");
        Application saved = applications.saveAndFlush(a);
        mails.applicationResult(saved);   // PB-22: email nếu sinh viên bật nhận email
        return ApplicantResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<ApplicantResponse> listForEmployer(Long userId) {
        return applications.findByJobEmployerUserIdOrderByAppliedAtDesc(userId).stream()
                .map(ApplicantResponse::from)
                .toList();
    }

    private static void checkOwner(JobPost j, Long userId) {
        if (!j.getEmployer().getUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Bạn chỉ xem và duyệt được ứng viên của tin do mình đăng");
        }
    }
}
