package com.gr7.backend.controller;

import com.gr7.backend.dto.CvUploadResponse;
import com.gr7.backend.dto.StudentProfileRequest;
import com.gr7.backend.dto.StudentProfileResponse;
import com.gr7.backend.security.CurrentUser;
import com.gr7.backend.service.StudentProfileService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/** Chỉ vai trò STUDENT gọi được (khai báo trong SecurityConfig). */
@RestController
@RequestMapping("/api/students/me")
public class StudentProfileController {

    private final StudentProfileService service;

    public StudentProfileController(StudentProfileService service) {
        this.service = service;
    }

    @GetMapping
    public StudentProfileResponse get(@AuthenticationPrincipal Jwt jwt) {
        return service.getMine(CurrentUser.id(jwt));
    }

    @PutMapping
    public StudentProfileResponse update(@AuthenticationPrincipal Jwt jwt,
                                         @Valid @RequestBody StudentProfileRequest req) {
        return service.updateMine(CurrentUser.id(jwt), req);
    }

    /** multipart/form-data, trường tên "file". */
    @PostMapping(value = "/cv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CvUploadResponse uploadCv(@AuthenticationPrincipal Jwt jwt,
                                     @RequestParam("file") MultipartFile file) {
        return new CvUploadResponse(service.uploadCv(CurrentUser.id(jwt), file));
    }
}
