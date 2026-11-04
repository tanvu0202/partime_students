package com.gr7.backend.entity;

import jakarta.persistence.*;

/** Bảng student_profiles – hồ sơ sinh viên, quan hệ 1–1 với users (FR-04). */
@Entity
@Table(name = "student_profiles")
public class StudentProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(length = 150)
    private String school;

    @Column(length = 100)
    private String major;

    @Column(length = 500)
    private String skills;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "cv_url", length = 255)
    private String cvUrl;

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getSchool() { return school; }
    public void setSchool(String school) { this.school = school; }
    public String getMajor() { return major; }
    public void setMajor(String major) { this.major = major; }
    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getCvUrl() { return cvUrl; }
    public void setCvUrl(String cvUrl) { this.cvUrl = cvUrl; }
}
