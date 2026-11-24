package com.gr7.backend.service;

import com.gr7.backend.dto.PageResponse;
import com.gr7.backend.dto.SavedJobResponse;
import com.gr7.backend.entity.JobPost;
import com.gr7.backend.entity.JobStatus;
import com.gr7.backend.entity.SavedJob;
import com.gr7.backend.entity.StudentProfile;
import com.gr7.backend.exception.ApiException;
import com.gr7.backend.repository.JobPostRepository;
import com.gr7.backend.repository.SavedJobRepository;
import com.gr7.backend.repository.StudentProfileRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Lưu việc yêu thích (PB-20, FR-23). Lưu lại tin đã lưu không báo lỗi và không tạo dòng trùng. */
@Service
public class SavedJobService {

    private static final int MAX_PAGE_SIZE = 100;

    private final SavedJobRepository saved;
    private final StudentProfileRepository students;
    private final JobPostRepository jobs;

    public SavedJobService(SavedJobRepository saved, StudentProfileRepository students, JobPostRepository jobs) {
        this.saved = saved;
        this.students = students;
        this.jobs = jobs;
    }

    @Transactional(readOnly = true)
    public PageResponse<SavedJobResponse> list(Long userId, int page, int size) {
        if (page < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Số trang phải từ 0 trở lên");
        }
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        var result = saved.findByStudentIdAndJobHiddenFalseOrderByCreatedAtDesc(
                student(userId).getId(), PageRequest.of(page, safeSize));
        return PageResponse.of(result, SavedJobResponse::from);
    }

    @Transactional
    public void save(Long userId, Long jobId) {
        StudentProfile s = student(userId);
        JobPost j = jobs.findById(jobId)
                // Tin chờ duyệt hoặc bị từ chối chưa công khai nên sinh viên không lưu được (TC-DX-03)
                .filter(x -> !x.isHidden() && x.getStatus() != JobStatus.PENDING && x.getStatus() != JobStatus.REJECTED)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tin tuyển dụng"));
        if (saved.existsByStudentIdAndJobId(s.getId(), jobId)) {
            return;
        }
        saved.save(new SavedJob(s, j));   // khóa UNIQUE(student_id, job_id) trong CSDL chặn dòng trùng
    }

    @Transactional
    public void remove(Long userId, Long jobId) {
        SavedJob s = saved.findByStudentIdAndJobId(student(userId).getId(), jobId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Bạn chưa lưu tin này"));
        saved.delete(s);
    }

    private StudentProfile student(Long userId) {
        return students.findByUserId(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ sinh viên"));
    }
}
