package com.gr7.backend.entity;

/** Trạng thái báo cáo tin: PENDING chờ xử lý, RESOLVED đã gỡ tin, DISMISSED bỏ qua (FR-24). */
public enum ReportStatus {
    PENDING, RESOLVED, DISMISSED
}
