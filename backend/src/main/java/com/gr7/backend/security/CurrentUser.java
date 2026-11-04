package com.gr7.backend.security;

import com.gr7.backend.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;

/** Lấy id người đang đăng nhập từ token (claim "sub"). */
public final class CurrentUser {

    private CurrentUser() {}

    public static Long id(Jwt jwt) {
        if (jwt == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Bạn chưa đăng nhập");
        }
        return Long.valueOf(jwt.getSubject());
    }
}
