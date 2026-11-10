package com.gr7.backend.controller;

import com.gr7.backend.dto.JobRequest;
import com.gr7.backend.dto.JobResponse;
import com.gr7.backend.security.CurrentUser;
import com.gr7.backend.service.JobService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/** Đăng / sửa / xóa / đóng tin – chỉ vai trò EMPLOYER (khai báo trong SecurityConfig). */
@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobService service;

    public JobController(JobService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<JobResponse> create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody JobRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(CurrentUser.id(jwt), req));
    }

    @PutMapping("/{id}")
    public JobResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                              @Valid @RequestBody JobRequest req) {
        return service.update(CurrentUser.id(jwt), id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        service.delete(CurrentUser.id(jwt), id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/close")
    public JobResponse close(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return service.close(CurrentUser.id(jwt), id);
    }
}
