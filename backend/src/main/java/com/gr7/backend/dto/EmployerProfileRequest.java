package com.gr7.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Body của PUT /api/employers/me. */
public record EmployerProfileRequest(
        @NotBlank(message = "Tên đơn vị không được để trống")
        @Size(max = 150, message = "Tên đơn vị tối đa 150 ký tự")
        String companyName,

        @Size(max = 2000, message = "Mô tả tối đa 2000 ký tự") String description,

        @Email(message = "Email liên hệ không đúng định dạng")
        @Size(max = 255, message = "Email tối đa 255 ký tự")
        String contactEmail,

        @Pattern(regexp = "^$|^[0-9+ ]{8,20}$", message = "Số điện thoại chỉ gồm số, 8–20 ký tự")
        String contactPhone,

        @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự") String address
) {}
