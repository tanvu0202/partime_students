package com.gr7.backend.repository;

import com.gr7.backend.entity.JobPost;
import com.gr7.backend.entity.JobStatus;
import com.gr7.backend.entity.SalaryUnit;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Điều kiện tìm kiếm động cho GET /api/jobs (PB-07).
 * Chỉ lấy tin đang tuyển (OPEN) và chưa bị ẩn; mỗi bộ lọc có giá trị thì thêm một điều kiện AND.
 */
public final class JobSpecifications {

    private JobSpecifications() {}

    public static Specification<JobPost> search(String keyword, String category, String location,
                                                BigDecimal minSalary, BigDecimal maxSalary, SalaryUnit unit) {
        return (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            ps.add(cb.equal(root.get("status"), JobStatus.OPEN));
            ps.add(cb.isFalse(root.<Boolean>get("hidden")));

            if (hasText(keyword)) {
                String kw = "%" + keyword.trim().toLowerCase() + "%";
                ps.add(cb.or(
                        cb.like(cb.lower(root.<String>get("title")), kw),
                        cb.like(cb.lower(root.<String>get("description")), kw),
                        cb.like(cb.lower(root.get("employer").<String>get("companyName")), kw)));
            }
            if (hasText(category)) {
                ps.add(cb.equal(root.get("category"), category.trim()));
            }
            if (hasText(location)) {
                ps.add(cb.like(cb.lower(root.<String>get("location")), "%" + location.trim().toLowerCase() + "%"));
            }
            if (unit != null) {
                ps.add(cb.equal(root.get("salaryUnit"), unit));
            }
            // Mức lương cao nhất của tin phải đạt mức sinh viên mong muốn
            if (minSalary != null) {
                Expression<BigDecimal> top = cb.coalesce(root.<BigDecimal>get("salaryMax"), root.<BigDecimal>get("salaryMin"));
                ps.add(cb.greaterThanOrEqualTo(top, minSalary));
            }
            // Mức lương thấp nhất của tin không vượt quá mức trần đã chọn
            if (maxSalary != null) {
                Expression<BigDecimal> low = cb.coalesce(root.<BigDecimal>get("salaryMin"), root.<BigDecimal>get("salaryMax"));
                ps.add(cb.lessThanOrEqualTo(low, maxSalary));
            }
            return cb.and(ps.toArray(new Predicate[0]));
        };
    }

    private static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }
}
