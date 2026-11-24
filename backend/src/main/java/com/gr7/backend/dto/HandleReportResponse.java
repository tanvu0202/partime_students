package com.gr7.backend.dto;

/** Kết quả xử lý: trạng thái mới và số báo cáo đang chờ của tin đó đã được xử lý cùng lúc. */
public record HandleReportResponse(Long id, Long jobId, String status, int handledCount, boolean jobHidden) {}
