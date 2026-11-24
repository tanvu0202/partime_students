package com.gr7.backend.dto;

import jakarta.validation.constraints.NotBlank;

/** Body của PATCH /api/admin/reports/{id}. action: HIDE_JOB (gỡ tin) | DISMISS (bỏ qua). */
public record HandleReportRequest(@NotBlank(message = "Vui lòng chọn cách xử lý") String action) {}
