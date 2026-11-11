package com.gr7.backend.dto;

import com.gr7.backend.entity.ApplicationStatus;
import jakarta.validation.constraints.NotNull;

/** { "status": "ACCEPTED" } hoặc { "status": "REJECTED" } */
public record ApplicationStatusRequest(
        @NotNull(message = "Vui lòng chọn trạng thái ACCEPTED hoặc REJECTED")
        ApplicationStatus status
) {}
