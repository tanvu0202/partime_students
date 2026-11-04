package com.gr7.backend.dto;

import jakarta.validation.constraints.NotBlank;

/** Body của POST /api/auth/login. */
public record LoginRequest(
        @NotBlank(message = "Email không được để trống") String email,
        @NotBlank(message = "Mật khẩu không được để trống") String password
) {}
