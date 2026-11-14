package com.gr7.backend.dto;

import com.gr7.backend.entity.EmployerProfile;
import com.gr7.backend.entity.JobPost;
import com.gr7.backend.entity.JobStatus;
import com.gr7.backend.entity.SalaryUnit;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.regex.Pattern;

/** Chi tiết một tin, kèm thông tin nhà tuyển dụng (PB-08). */
public record JobResponse(
        Long id, String title, String description, String category, String location,
        BigDecimal salaryMin, BigDecimal salaryMax, SalaryUnit salaryUnit, String workTime,
        Integer slots, JobStatus status, LocalDateTime createdAt, LocalDateTime updatedAt,
        Long employerId, String companyName, String companyAddress, String companyDescription,
        String contactEmail, String contactPhone
) {
    // Email và số điện thoại nhà tuyển dụng tự gõ trong phần mô tả cũng phải che với khách
    private static final Pattern EMAIL = Pattern.compile("[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+");
    private static final Pattern PHONE = Pattern.compile("(\\+?84|0)([\\s.-]?\\d){8,10}");
    private static final String HIDDEN = "[đăng nhập để xem]";

    public static JobResponse from(JobPost j) {
        EmployerProfile e = j.getEmployer();
        return new JobResponse(j.getId(), j.getTitle(), j.getDescription(), j.getCategory(), j.getLocation(),
                j.getSalaryMin(), j.getSalaryMax(), j.getSalaryUnit(), j.getWorkTime(),
                j.getSlots(), j.getStatus(), j.getCreatedAt(), j.getUpdatedAt(),
                e.getId(), e.getCompanyName(), e.getAddress(), e.getDescription(),
                e.getContactEmail(), e.getContactPhone());
    }

    /**
     * Bản dành cho khách chưa đăng nhập: bỏ email, số điện thoại liên hệ
     * và che email, số điện thoại nằm trong mô tả tin, mô tả công ty.
     */
    public JobResponse withoutContact() {
        return new JobResponse(id, title, mask(description), category, location, salaryMin, salaryMax, salaryUnit, workTime,
                slots, status, createdAt, updatedAt, employerId, companyName, companyAddress, mask(companyDescription),
                null, null);
    }

    static String mask(String text) {
        if (text == null) return null;
        String noEmail = EMAIL.matcher(text).replaceAll(HIDDEN);
        return PHONE.matcher(noEmail).replaceAll(HIDDEN);
    }
}
