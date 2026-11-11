package com.gr7.backend.service;

import com.gr7.backend.dto.ApplyRequest;
import com.gr7.backend.dto.MyApplicationResponse;
import com.gr7.backend.entity.Application;
import com.gr7.backend.entity.JobPost;
import com.gr7.backend.entity.JobStatus;
import com.gr7.backend.entity.StudentProfile;
import com.gr7.backend.exception.ApiException;
import com.gr7.backend.repository.ApplicationRepository;
import com.gr7.backend.repository.JobPostRepository;
import com.gr7.backend.repository.StudentProfileRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Ứng tuyển và theo dõi đơn (PB-09, PB-10). */
@Service
public class ApplicationService {

    private final ApplicationRepository applications;
    private final JobPostRepository jobs;
    private final StudentProfileRepository students;

    public ApplicationService(ApplicationRepository applications, JobPostRepository jobs,
                              StudentProfileRepository students) {
        this.applications = applications;
        this.jobs = jobs;
        this.students = students;
    }

    /**
     * Quy tắc: tin không tồn tại/bị ẩn -> 404; tin không còn OPEN -> 400; đã ứng tuyển tin này -> 409.
     * Đơn mới luôn ở trạng thái PENDING; CV lấy từ hồ sơ tại thời điểm nộp.
     */
    @Transactional
    public MyApplicationResponse apply(Long userId, Long jobId, ApplyRequest req) {
        StudentProfile s = students.findByUserId(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ sinh viên"));
        JobPost j = jobs.findById(jobId)
                .filter(x -> !x.isHidden())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tin tuyển dụng"));
        if (j.getStatus() != JobStatus.OPEN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tin này đã ngừng nhận hồ sơ");
        }
        if (applications.existsByJobIdAndStudentId(jobId, s.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Bạn đã ứng tuyển tin này rồi");
        }
        Application a = new Application();
        a.setJob(j);
        a.setStudent(s);
        a.setCoverLetter(req == null || req.coverLetter() == null || req.coverLetter().isBlank()
                ? null : req.coverLetter().trim());
        a.setCvUrl(s.getCvUrl());
        try {
            return MyApplicationResponse.from(applications.saveAndFlush(a));
        } catch (DataIntegrityViolationException e) {
            // Hai yêu cầu gửi cùng lúc: khóa UNIQUE(job_id, student_id) trong CSDL chặn lại
            throw new ApiException(HttpStatus.CONFLICT, "Bạn đã ứng tuyển tin này rồi");
        }
    }

    @Transactional(readOnly = true)
    public List<MyApplicationResponse> mine(Long userId) {
        StudentProfile s = students.findByUserId(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ sinh viên"));
        return applications.findByStudentIdOrderByAppliedAtDesc(s.getId()).stream()
                .map(MyApplicationResponse::from)
                .toList();
    }
}
