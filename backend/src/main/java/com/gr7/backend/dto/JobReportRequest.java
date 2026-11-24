package com.gr7.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Body của POST /api/jobs/{id}/reports. reason: DEPOSIT | FALSE_INFO | SCAM | OTHER. */
public record JobReportRequest(
        @NotBlank(message = "Vui lòng chọn lý do báo cáo") String reason,
        @Size(max = 500, message = "Mô tả tối đa 500 ký tự") String description
) {}
