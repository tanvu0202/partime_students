package com.gr7.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Một dòng ở tab Báo cáo tin (MH-16): các báo cáo cùng trạng thái của một tin được gom lại.
 * reportId là báo cáo mới nhất, dùng làm {id} khi gọi PATCH /api/admin/reports/{id}.
 */
public record ReportedJobResponse(Long reportId, Long jobId, String jobTitle, String companyName, boolean jobHidden,
                                  String status, int reportCount, String mainReason, String mainReasonLabel,
                                  LocalDateTime latestAt, List<JobReportResponse> reports) {}
