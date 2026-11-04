package com.gr7.backend.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

/** Định dạng lỗi chung theo API contract: { "status", "message", "errors" }. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(int status, String message, Map<String, String> errors) {

    public static ErrorResponse of(int status, String message) {
        return new ErrorResponse(status, message, null);
    }
}
