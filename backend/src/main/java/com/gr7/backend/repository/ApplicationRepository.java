package com.gr7.backend.repository;

import com.gr7.backend.entity.Application;
import com.gr7.backend.entity.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** Các hàm dựng sẵn cho Sprint 3 (B6-06): ứng tuyển, theo dõi đơn, xem ứng viên. */
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    boolean existsByJobIdAndStudentId(Long jobId, Long studentId);
    List<Application> findByStudentIdOrderByAppliedAtDesc(Long studentId);
    List<Application> findByJobIdOrderByAppliedAtDesc(Long jobId);
    long countByJobId(Long jobId);
    long countByJobIdAndStatus(Long jobId, ApplicationStatus status);
}
