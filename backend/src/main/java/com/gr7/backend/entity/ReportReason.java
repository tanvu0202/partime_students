package com.gr7.backend.entity;

/** Lý do sinh viên báo cáo tin (FR-24). */
public enum ReportReason {
    DEPOSIT("Đòi đặt cọc / thu phí"),
    FALSE_INFO("Thông tin sai sự thật"),
    SCAM("Có dấu hiệu lừa đảo"),
    OTHER("Lý do khác");

    private final String label;

    ReportReason(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
