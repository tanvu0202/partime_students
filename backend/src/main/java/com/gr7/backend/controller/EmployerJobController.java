package com.gr7.backend.controller;

import com.gr7.backend.dto.JobResponse;
import com.gr7.backend.dto.MyJobResponse;
import com.gr7.backend.security.CurrentUser;
import com.gr7.backend.service.JobService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Trang "Tin của tôi" của nhà tuyển dụng (nằm dưới /api/employers/** nên chỉ EMPLOYER gọi được). */
@RestController
@RequestMapping("/api/employers/me/jobs")
public class EmployerJobController {

    private final JobService service;

    public EmployerJobController(JobService service) {
        this.service = service;
    }

    @GetMapping
    public List<MyJobResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return service.listMine(CurrentUser.id(jwt));
    }

    /** Lấy đủ thông tin một tin của mình để đổ vào form sửa (kể cả tin đã đóng). */
    @GetMapping("/{id}")
    public JobResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return service.getMine(CurrentUser.id(jwt), id);
    }
}
