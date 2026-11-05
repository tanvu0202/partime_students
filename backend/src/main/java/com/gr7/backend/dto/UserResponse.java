package com.gr7.backend.dto;

import com.gr7.backend.entity.User;

/** Thông tin người dùng trả về cho đăng ký và GET /api/auth/me (không bao giờ trả mật khẩu). */
public record UserResponse(Long id, String email, String role, String fullName, String phone, String status) {

    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getEmail(), u.getRole().name(), u.getFullName(),
                u.getPhone(), u.getStatus().name());
    }
}
