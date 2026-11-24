package com.gr7.backend.controller;

import com.gr7.backend.dto.EmailSettingsRequest;
import com.gr7.backend.dto.EmailSettingsResponse;
import com.gr7.backend.security.CurrentUser;
import com.gr7.backend.service.UserSettingsService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/** Cài đặt của tài khoản đang đăng nhập (PB-22). Giá trị hiện tại đọc qua GET /api/auth/me (emailNotify). */
@RestController
@RequestMapping("/api/users/me")
public class UserSettingsController {

    private final UserSettingsService service;

    public UserSettingsController(UserSettingsService service) {
        this.service = service;
    }

    /** 200 + giá trị mới; 400 thiếu emailNotify. Chỉ sinh viên và nhà tuyển dụng. */
    @PatchMapping("/email-settings")
    public EmailSettingsResponse emailSettings(@AuthenticationPrincipal Jwt jwt,
                                               @Valid @RequestBody EmailSettingsRequest req) {
        return service.setEmailNotify(CurrentUser.id(jwt), req.emailNotify());
    }
}
