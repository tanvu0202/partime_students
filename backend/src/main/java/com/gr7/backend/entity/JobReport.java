package com.gr7.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/** Bảng job_reports – báo cáo tin đáng ngờ; UNIQUE(job_id, reporter_id) nên mỗi sinh viên báo cáo một tin một lần (FR-24). */
@Entity
@Table(name = "job_reports",
       uniqueConstraints = @UniqueConstraint(name = "uq_report_job_reporter", columnNames = {"job_id", "reporter_id"}))
public class JobReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false)
    private JobPost job;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_id", nullable = false)
    private StudentProfile reporter;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportReason reason;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status = ReportStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "handled_at")
    private LocalDateTime handledAt;

    @PrePersist
    void onCreate() { createdAt = LocalDateTime.now(); }

    public JobReport() {}

    public JobReport(JobPost job, StudentProfile reporter, ReportReason reason, String description) {
        this.job = job;
        this.reporter = reporter;
        this.reason = reason;
        this.description = description;
    }

    public Long getId() { return id; }
    public JobPost getJob() { return job; }
    public StudentProfile getReporter() { return reporter; }
    public ReportReason getReason() { return reason; }
    public String getDescription() { return description; }
    public ReportStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getHandledAt() { return handledAt; }

    /** Quản trị viên xử lý: đổi trạng thái và ghi thời điểm xử lý. */
    public void handle(ReportStatus result) {
        this.status = result;
        this.handledAt = LocalDateTime.now();
    }
}
