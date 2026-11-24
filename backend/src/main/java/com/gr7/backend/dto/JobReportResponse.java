package com.gr7.backend.dto;

import com.gr7.backend.entity.JobReport;
import java.time.LocalDateTime;

/** Kết quả gửi báo cáo (201) và một dòng báo cáo trong khung chi tiết của quản trị viên. */
public record JobReportResponse(Long id, Long jobId, String reason, String reasonLabel, String description,
                                String reporterName, String status, LocalDateTime createdAt, LocalDateTime handledAt) {

    public static JobReportResponse from(JobReport r) {
        return new JobReportResponse(r.getId(), r.getJob().getId(), r.getReason().name(), r.getReason().label(),
                r.getDescription(), r.getReporter().getUser().getFullName(), r.getStatus().name(),
                r.getCreatedAt(), r.getHandledAt());
    }
}
