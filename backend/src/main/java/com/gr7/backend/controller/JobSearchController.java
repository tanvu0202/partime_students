package com.gr7.backend.controller;

import com.gr7.backend.dto.CategoryCount;
import com.gr7.backend.dto.JobResponse;
import com.gr7.backend.dto.JobSummary;
import com.gr7.backend.dto.PageResponse;
import com.gr7.backend.entity.SalaryUnit;
import com.gr7.backend.service.JobSearchService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * GET /api/jobs?keyword=&category=&location=&minSalary=&maxSalary=&salaryUnit=&sort=newest|salary&page=0&size=10
 * GET /api/jobs/{id}, GET /api/jobs/categories – công khai, không cần token.
 * Chi tiết tin: khách chưa đăng nhập không thấy email, số điện thoại của nhà tuyển dụng.
 */
@RestController
@RequestMapping("/api/jobs")
public class JobSearchController {

    private final JobSearchService service;

    public JobSearchController(JobSearchService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<JobSummary> search(@RequestParam(required = false) String keyword,
                                           @RequestParam(required = false) String category,
                                           @RequestParam(required = false) String location,
                                           @RequestParam(required = false) BigDecimal minSalary,
                                           @RequestParam(required = false) BigDecimal maxSalary,
                                           @RequestParam(required = false) SalaryUnit salaryUnit,
                                           @RequestParam(defaultValue = "newest") String sort,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "10") int size) {
        return service.search(keyword, category, location, minSalary, maxSalary, salaryUnit, sort, page, size);
    }

    @GetMapping("/categories")
    public List<CategoryCount> categories() {
        return service.categories();
    }

    @GetMapping("/{id}")
    public JobResponse detail(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        JobResponse job = service.detail(id);
        return jwt == null ? job.withoutContact() : job;
    }
}
