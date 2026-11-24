package com.gr7.backend.repository;

import com.gr7.backend.entity.JobReport;
import com.gr7.backend.entity.ReportStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobReportRepository extends JpaRepository<JobReport, Long> {
    boolean existsByJobIdAndReporterId(Long jobId, Long reporterId);

    @EntityGraph(attributePaths = {"job", "job.employer", "reporter", "reporter.user"})
    List<JobReport> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"reporter", "reporter.user"})
    List<JobReport> findByJobIdAndStatus(Long jobId, ReportStatus status);

    long countByStatus(ReportStatus status);
}
