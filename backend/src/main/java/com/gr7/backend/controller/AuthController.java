package com.gr7.backend.controller;

import com.gr7.backend.dto.AuthResponse;
import com.gr7.backend.dto.LoginRequest;
import com.gr7.backend.dto.RegisterRequest;
import com.gr7.backend.dto.UserResponse;
import com.gr7.backend.security.CurrentUser;
import com.gr7.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** 201 khi đăng ký thành công; 400 dữ liệu sai; 409 email đã tồn tại. */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest req) {
        return authService.register(req);
    }

    /** 200 kèm token; 401 sai email/mật khẩu; 403 tài khoản bị khóa. */
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    /** Frontend gọi khi tải lại trang để biết ai đang đăng nhập. */
    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal Jwt jwt) {
        return authService.me(CurrentUser.id(jwt));
    }
}
