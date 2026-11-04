package com.gr7.backend.exception;

import org.springframework.http.HttpStatus;

/** Lỗi nghiệp vụ có mã HTTP rõ ràng, ví dụ 409 email đã tồn tại, 403 tài khoản bị khóa. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() { return status; }
}
