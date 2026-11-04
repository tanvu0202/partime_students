package com.gr7.backend.dto;

/** Kết quả đăng nhập: token JWT + thông tin cơ bản để frontend điều hướng theo vai trò. */
public record AuthResponse(String token, Long id, String email, String role, String fullName) {}
