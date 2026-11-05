package com.gr7.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Bảng job_posts – tin việc làm part-time (FR-06 → FR-10, FR-15, FR-19). */
@Entity
@Table(name = "job_posts")
public class JobPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employer_id", nullable = false)
    private EmployerProfile employer;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, length = 150)
    private String location;

    @Column(name = "salary_min", precision = 12, scale = 0)
    private BigDecimal salaryMin;

    @Column(name = "salary_max", precision = 12, scale = 0)
    private BigDecimal salaryMax;

    @Enumerated(EnumType.STRING)
    @Column(name = "salary_unit", nullable = false)
    private SalaryUnit salaryUnit;

    @Column(name = "work_time", nullable = false, length = 200)
    private String workTime;

    @Column(nullable = false)
    private Integer slots = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobStatus status = JobStatus.OPEN;

    @Column(nullable = false)
    private boolean hidden = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() { createdAt = LocalDateTime.now(); }

    @PreUpdate
    void onUpdate() { updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public EmployerProfile getEmployer() { return employer; }
    public void setEmployer(EmployerProfile employer) { this.employer = employer; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public BigDecimal getSalaryMin() { return salaryMin; }
    public void setSalaryMin(BigDecimal salaryMin) { this.salaryMin = salaryMin; }
    public BigDecimal getSalaryMax() { return salaryMax; }
    public void setSalaryMax(BigDecimal salaryMax) { this.salaryMax = salaryMax; }
    public SalaryUnit getSalaryUnit() { return salaryUnit; }
    public void setSalaryUnit(SalaryUnit salaryUnit) { this.salaryUnit = salaryUnit; }
    public String getWorkTime() { return workTime; }
    public void setWorkTime(String workTime) { this.workTime = workTime; }
    public Integer getSlots() { return slots; }
    public void setSlots(Integer slots) { this.slots = slots; }
    public JobStatus getStatus() { return status; }
    public void setStatus(JobStatus status) { this.status = status; }
    public boolean isHidden() { return hidden; }
    public void setHidden(boolean hidden) { this.hidden = hidden; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
