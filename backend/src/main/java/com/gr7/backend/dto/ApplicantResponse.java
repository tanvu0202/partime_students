package com.gr7.backend.dto;

import com.gr7.backend.entity.Application;
import com.gr7.backend.entity.ApplicationStatus;
import com.gr7.backend.entity.StudentProfile;
import com.gr7.backend.entity.User;

import java.time.LocalDateTime;

/** Một ứng viên trong danh sách nhà tuyển dụng xem (PB-11). */
public record ApplicantResponse(
        Long id, Long studentId, String fullName, String email, String phone,
        String school, String major, String skills, String cvUrl, String coverLetter,
        ApplicationStatus status, LocalDateTime appliedAt, LocalDateTime updatedAt
) {
    public static ApplicantResponse from(Application a) {
        StudentProfile s = a.getStudent();
        User u = s.getUser();
        return new ApplicantResponse(a.getId(), s.getId(), u.getFullName(), u.getEmail(), u.getPhone(),
                s.getSchool(), s.getMajor(), s.getSkills(), a.getCvUrl(), a.getCoverLetter(),
                a.getStatus(), a.getAppliedAt(), a.getUpdatedAt());
    }
}
