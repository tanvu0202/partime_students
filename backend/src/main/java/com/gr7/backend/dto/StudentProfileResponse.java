package com.gr7.backend.dto;

import com.gr7.backend.entity.StudentProfile;
import com.gr7.backend.entity.User;

public record StudentProfileResponse(Long id, String email, String fullName, String phone,
                                     String school, String major, String skills, String bio, String cvUrl) {

    public static StudentProfileResponse from(StudentProfile p) {
        User u = p.getUser();
        return new StudentProfileResponse(p.getId(), u.getEmail(), u.getFullName(), u.getPhone(),
                p.getSchool(), p.getMajor(), p.getSkills(), p.getBio(), p.getCvUrl());
    }
}
