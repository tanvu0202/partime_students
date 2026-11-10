package com.gr7.backend.dto;

import com.gr7.backend.entity.EmployerProfile;
import com.gr7.backend.entity.JobPost;
import com.gr7.backend.entity.JobStatus;
import com.gr7.backend.entity.SalaryUnit;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Chi tiết một tin, kèm thông tin nhà tuyển dụng (PB-08). */
public record JobResponse(
        Long id, String title, String description, String category, String location,
        BigDecimal salaryMin, BigDecimal salaryMax, SalaryUnit salaryUnit, String workTime,
        Integer slots, JobStatus status, LocalDateTime createdAt, LocalDateTime updatedAt,
        Long employerId, String companyName, String companyAddress, String companyDescription,
        String contactEmail, String contactPhone
) {
    public static JobResponse from(JobPost j) {
        EmployerProfile e = j.getEmployer();
        return new JobResponse(j.getId(), j.getTitle(), j.getDescription(), j.getCategory(), j.getLocation(),
                j.getSalaryMin(), j.getSalaryMax(), j.getSalaryUnit(), j.getWorkTime(),
                j.getSlots(), j.getStatus(), j.getCreatedAt(), j.getUpdatedAt(),
                e.getId(), e.getCompanyName(), e.getAddress(), e.getDescription(),
                e.getContactEmail(), e.getContactPhone());
    }
}
