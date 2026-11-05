package com.gr7.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Body của PUT /api/students/me. */
public record StudentProfileRequest(
        @NotBlank(message = "Họ tên không được để trống")
        @Size(max = 100, message = "Họ tên tối đa 100 ký tự")
        String fullName,

        @Pattern(regexp = "^$|^[0-9+ ]{8,20}$", message = "Số điện thoại chỉ gồm số, 8–20 ký tự")
        String phone,

        @Size(max = 150, message = "Tên trường tối đa 150 ký tự") String school,
        @Size(max = 100, message = "Ngành học tối đa 100 ký tự") String major,
        @Size(max = 500, message = "Kỹ năng tối đa 500 ký tự") String skills,
        @Size(max = 2000, message = "Giới thiệu tối đa 2000 ký tự") String bio
) {}
