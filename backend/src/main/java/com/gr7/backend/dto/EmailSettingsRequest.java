package com.gr7.backend.dto;

import jakarta.validation.constraints.NotNull;

/** Body của PATCH /api/users/me/email-settings. */
public record EmailSettingsRequest(@NotNull(message = "Vui lòng chọn bật hoặc tắt nhận email") Boolean emailNotify) {}
