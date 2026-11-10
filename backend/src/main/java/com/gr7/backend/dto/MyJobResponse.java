package com.gr7.backend.dto;

import com.gr7.backend.entity.JobPost;
import com.gr7.backend.entity.JobStatus;
import com.gr7.backend.entity.SalaryUnit;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Một dòng trong trang "Tin của tôi" của nhà tuyển dụng: kèm số đơn và số đơn chờ duyệt. */
public record MyJobResponse(
        Long id, String title, String category, String location,
        BigDecimal salaryMin, BigDecimal salaryMax, SalaryUnit salaryUnit, String workTime,
        Integer slots, JobStatus status, boolean hidden, LocalDateTime createdAt,
        long applicationCount, long pendingCount
) {
    public static MyJobResponse from(JobPost j, long applicationCount, long pendingCount) {
        return new MyJobResponse(j.getId(), j.getTitle(), j.getCategory(), j.getLocation(),
                j.getSalaryMin(), j.getSalaryMax(), j.getSalaryUnit(), j.getWorkTime(),
                j.getSlots(), j.getStatus(), j.isHidden(), j.getCreatedAt(), applicationCount, pendingCount);
    }
}
