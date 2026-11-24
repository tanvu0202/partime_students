package com.gr7.backend.dto;

import jakarta.validation.constraints.NotBlank;

/** Body của POST /api/auth/facebook: access token lấy từ Facebook Login (FB.login). */
public record FacebookLoginRequest(@NotBlank(message = "Thiếu access token của Facebook") String accessToken) {}
