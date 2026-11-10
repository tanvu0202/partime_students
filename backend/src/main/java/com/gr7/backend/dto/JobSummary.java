package com.gr7.backend.dto;

import com.gr7.backend.entity.JobPost;
import com.gr7.backend.entity.SalaryUnit;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Một dòng trong danh sách tìm việc (PB-07): đủ để hiển thị thẻ tin, không kèm mô tả dài. */
public record JobSummary(
        Long id, String title, String category, String location,
        BigDecimal salaryMin, BigDecimal salaryMax, SalaryUnit salaryUnit, String workTime,
        Integer slots, LocalDateTime createdAt, Long employerId, String companyName
) {
    public static JobSummary from(JobPost j) {
        return new JobSummary(j.getId(), j.getTitle(), j.getCategory(), j.getLocation(),
                j.getSalaryMin(), j.getSalaryMax(), j.getSalaryUnit(), j.getWorkTime(),
                j.getSlots(), j.getCreatedAt(), j.getEmployer().getId(), j.getEmployer().getCompanyName());
    }
}
