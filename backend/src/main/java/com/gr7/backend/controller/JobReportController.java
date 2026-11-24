package com.gr7.backend.controller;

import com.gr7.backend.dto.HandleReportRequest;
import com.gr7.backend.dto.HandleReportResponse;
import com.gr7.backend.dto.JobReportRequest;
import com.gr7.backend.dto.JobReportResponse;
import com.gr7.backend.dto.ReportedJobResponse;
import com.gr7.backend.security.CurrentUser;
import com.gr7.backend.service.JobReportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Báo cáo tin đáng ngờ (PB-21): sinh viên gửi báo cáo, quản trị viên xem và xử lý (MH-03, MH-16). */
@RestController
public class JobReportController {

    private final JobReportService service;

    public JobReportController(JobReportService service) {
        this.service = service;
    }

    @PostMapping("/api/jobs/{id}/reports")
    @ResponseStatus(HttpStatus.CREATED)
    public JobReportResponse report(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                    @Valid @RequestBody JobReportRequest req) {
        return service.report(CurrentUser.id(jwt), id, req);
    }

    @GetMapping("/api/admin/reports")
    public List<ReportedJobResponse> list(@RequestParam(required = false) String status) {
        return service.adminList(status);
    }

    @PatchMapping("/api/admin/reports/{id}")
    public HandleReportResponse handle(@PathVariable Long id, @Valid @RequestBody HandleReportRequest req) {
        return service.handle(id, req.action());
    }
}
