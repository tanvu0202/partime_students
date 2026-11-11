package com.gr7.backend.controller;

import com.gr7.backend.dto.ApplyRequest;
import com.gr7.backend.dto.MyApplicationResponse;
import com.gr7.backend.security.CurrentUser;
import com.gr7.backend.service.ApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Ứng tuyển (STUDENT) – quyền khai báo trong SecurityConfig. */
@RestController
public class ApplicationController {

    private final ApplicationService service;

    public ApplicationController(ApplicationService service) {
        this.service = service;
    }

    /** Body không bắt buộc: { "coverLetter": "..." } */
    @PostMapping("/api/jobs/{jobId}/applications")
    public ResponseEntity<MyApplicationResponse> apply(@AuthenticationPrincipal Jwt jwt, @PathVariable Long jobId,
                                                       @Valid @RequestBody(required = false) ApplyRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.apply(CurrentUser.id(jwt), jobId, req));
    }

    @GetMapping("/api/applications/me")
    public List<MyApplicationResponse> mine(@AuthenticationPrincipal Jwt jwt) {
        return service.mine(CurrentUser.id(jwt));
    }
}
