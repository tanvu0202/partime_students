package com.gr7.backend.controller;

import com.gr7.backend.dto.EmployerProfileRequest;
import com.gr7.backend.dto.EmployerProfileResponse;
import com.gr7.backend.security.CurrentUser;
import com.gr7.backend.service.EmployerProfileService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/** Chỉ vai trò EMPLOYER gọi được (khai báo trong SecurityConfig). */
@RestController
@RequestMapping("/api/employers/me")
public class EmployerProfileController {

    private final EmployerProfileService service;

    public EmployerProfileController(EmployerProfileService service) {
        this.service = service;
    }

    @GetMapping
    public EmployerProfileResponse get(@AuthenticationPrincipal Jwt jwt) {
        return service.getMine(CurrentUser.id(jwt));
    }

    @PutMapping
    public EmployerProfileResponse update(@AuthenticationPrincipal Jwt jwt,
                                          @Valid @RequestBody EmployerProfileRequest req) {
        return service.updateMine(CurrentUser.id(jwt), req);
    }
}
