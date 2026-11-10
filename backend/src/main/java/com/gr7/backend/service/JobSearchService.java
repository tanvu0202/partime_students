package com.gr7.backend.service;

import com.gr7.backend.dto.CategoryCount;
import com.gr7.backend.dto.JobResponse;
import com.gr7.backend.dto.JobSummary;
import com.gr7.backend.dto.PageResponse;
import com.gr7.backend.entity.JobPost;
import com.gr7.backend.entity.SalaryUnit;
import com.gr7.backend.exception.ApiException;
import com.gr7.backend.repository.JobPostRepository;
import com.gr7.backend.repository.JobSpecifications;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/** Tìm kiếm + lọc + phân trang, xem chi tiết tin (PB-07, PB-08). Ai cũng xem được, không cần đăng nhập. */
@Service
public class JobSearchService {

    private static final int MAX_PAGE_SIZE = 50;

    private final JobPostRepository jobs;

    public JobSearchService(JobPostRepository jobs) {
        this.jobs = jobs;
    }

    @Transactional(readOnly = true)
    public PageResponse<JobSummary> search(String keyword, String category, String location,
                                           BigDecimal minSalary, BigDecimal maxSalary, SalaryUnit unit,
                                           String sort, int page, int size) {
        if (page < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Số trang phải từ 0 trở lên");
        }
        if (minSalary != null && maxSalary != null && minSalary.compareTo(maxSalary) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mức lương từ không được lớn hơn mức lương đến");
        }
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Sort order = "salary".equals(sort)
                ? Sort.by(Sort.Order.desc("salaryMax"), Sort.Order.desc("id"))
                : Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));

        var result = jobs.findAll(
                JobSpecifications.search(keyword, category, location, minSalary, maxSalary, unit),
                PageRequest.of(page, safeSize, order));
        return PageResponse.of(result, JobSummary::from);
    }

    /** Tin bị ẩn hoặc không tồn tại -> 404. Tin đã đóng vẫn xem được để sinh viên theo dõi đơn cũ. */
    @Transactional(readOnly = true)
    public JobResponse detail(Long id) {
        JobPost j = jobs.findById(id)
                .filter(x -> !x.isHidden())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tin tuyển dụng"));
        return JobResponse.from(j);
    }

    @Transactional(readOnly = true)
    public List<CategoryCount> categories() {
        return jobs.countOpenByCategory();
    }
}
