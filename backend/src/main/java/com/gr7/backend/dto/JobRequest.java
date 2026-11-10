package com.gr7.backend.dto;

import com.gr7.backend.entity.SalaryUnit;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/** Dữ liệu đăng / sửa tin (PB-05, PB-06). */
public record JobRequest(
        @NotBlank(message = "Tiêu đề không được để trống")
        @Size(max = 200, message = "Tiêu đề tối đa 200 ký tự")
        String title,

        @NotBlank(message = "Mô tả công việc không được để trống")
        @Size(max = 5000, message = "Mô tả tối đa 5000 ký tự")
        String description,

        @NotBlank(message = "Vui lòng chọn ngành nghề")
        @Size(max = 100, message = "Ngành nghề tối đa 100 ký tự")
        String category,

        @NotBlank(message = "Địa điểm không được để trống")
        @Size(max = 150, message = "Địa điểm tối đa 150 ký tự")
        String location,

        @PositiveOrZero(message = "Lương tối thiểu không được âm")
        BigDecimal salaryMin,

        @PositiveOrZero(message = "Lương tối đa không được âm")
        BigDecimal salaryMax,

        @NotNull(message = "Vui lòng chọn đơn vị lương")
        SalaryUnit salaryUnit,

        @NotBlank(message = "Thời gian làm việc không được để trống")
        @Size(max = 200, message = "Thời gian làm việc tối đa 200 ký tự")
        String workTime,

        @NotNull(message = "Vui lòng nhập số lượng cần tuyển")
        @Min(value = 1, message = "Số lượng cần tuyển ít nhất là 1")
        @Max(value = 100, message = "Số lượng cần tuyển tối đa 100")
        Integer slots
) {}
