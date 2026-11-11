package com.gr7.backend.dto;

import com.gr7.backend.entity.Application;
import com.gr7.backend.entity.ApplicationStatus;
import com.gr7.backend.entity.JobPost;
import com.gr7.backend.entity.JobStatus;
import com.gr7.backend.entity.SalaryUnit;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Một đơn trong trang "Đơn của tôi" của sinh viên (PB-10). */
public record MyApplicationResponse(
        Long id, Long jobId, String jobTitle, String companyName, String location,
        BigDecimal salaryMin, BigDecimal salaryMax, SalaryUnit salaryUnit, JobStatus jobStatus,
        ApplicationStatus status, String coverLetter, String cvUrl,
        LocalDateTime appliedAt, LocalDateTime updatedAt
) {
    public static MyApplicationResponse from(Application a) {
        JobPost j = a.getJob();
        return new MyApplicationResponse(a.getId(), j.getId(), j.getTitle(), j.getEmployer().getCompanyName(),
                j.getLocation(), j.getSalaryMin(), j.getSalaryMax(), j.getSalaryUnit(), j.getStatus(),
                a.getStatus(), a.getCoverLetter(), a.getCvUrl(), a.getAppliedAt(), a.getUpdatedAt());
    }
}
