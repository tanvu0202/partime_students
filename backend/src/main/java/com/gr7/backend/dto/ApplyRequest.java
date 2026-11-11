package com.gr7.backend.dto;

import jakarta.validation.constraints.Size;

/** Thư giới thiệu khi ứng tuyển (không bắt buộc). CV lấy từ hồ sơ sinh viên. */
public record ApplyRequest(
        @Size(max = 2000, message = "Thư giới thiệu tối đa 2000 ký tự")
        String coverLetter
) {}
