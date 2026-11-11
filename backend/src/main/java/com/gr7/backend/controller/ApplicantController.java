package com.gr7.backend.controller;

import com.gr7.backend.dto.ApplicantResponse;
import com.gr7.backend.dto.ApplicationStatusRequest;
import com.gr7.backend.security.CurrentUser;
import com.gr7.backend.service.ApplicantService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Xem ứng viên, duyệt / từ chối (EMPLOYER) – quyền khai báo trong SecurityConfig. */
@RestController
public class ApplicantController {

    private final ApplicantService service;

    public ApplicantController(ApplicantService service) {
        this.service = service;
    }

    @GetMapping("/api/jobs/{jobId}/applications")
    public List<ApplicantResponse> list(@AuthenticationPrincipal Jwt jwt, @PathVariable Long jobId) {
        return service.listForJob(CurrentUser.id(jwt), jobId);
    }

    @PatchMapping("/api/applications/{id}/status")
    public ApplicantResponse updateStatus(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                          @Valid @RequestBody ApplicationStatusRequest req) {
        return service.updateStatus(CurrentUser.id(jwt), id, req.status());
    }
}
