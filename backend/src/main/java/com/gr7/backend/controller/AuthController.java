package com.gr7.backend.controller;

import com.gr7.backend.dto.AuthResponse;
import com.gr7.backend.dto.FacebookLoginRequest;
import com.gr7.backend.dto.ForgotPasswordRequest;
import com.gr7.backend.dto.GoogleLoginRequest;
import com.gr7.backend.dto.LoginRequest;
import com.gr7.backend.dto.MessageResponse;
import com.gr7.backend.dto.RegisterRequest;
import com.gr7.backend.dto.ResetPasswordRequest;
import com.gr7.backend.dto.SocialCompleteRequest;
import com.gr7.backend.dto.UserResponse;
import com.gr7.backend.security.CurrentUser;
import com.gr7.backend.security.FacebookTokenVerifier;
import com.gr7.backend.security.GoogleTokenVerifier;
import com.gr7.backend.service.AuthService;
import com.gr7.backend.service.PasswordResetService;
import com.gr7.backend.service.SocialAuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final SocialAuthService socialAuth;
    private final GoogleTokenVerifier google;
    private final FacebookTokenVerifier facebook;
    private final PasswordResetService passwordReset;

    public AuthController(AuthService authService, SocialAuthService socialAuth, GoogleTokenVerifier google,
                          FacebookTokenVerifier facebook, PasswordResetService passwordReset) {
        this.authService = authService;
        this.socialAuth = socialAuth;
        this.google = google;
        this.facebook = facebook;
        this.passwordReset = passwordReset;
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

    /** PB-17: 200 + token (đã có tài khoản); 202 + signupToken (lần đầu); 401 token sai; 403 bị khóa. */
    @PostMapping("/google")
    public ResponseEntity<?> google(@Valid @RequestBody GoogleLoginRequest req) {
        return social(socialAuth.login(google.verify(req.idToken())));
    }

    /**
     * PB-18: giống /google. 200 + token; 202 + signupToken (lần đầu, Facebook không trả email thì email = null
     * và MH-13 bắt nhập email); 401 token sai hoặc của ứng dụng khác; 403 bị khóa; 503 chưa cấu hình App ID.
     */
    @PostMapping("/facebook")
    public ResponseEntity<?> facebook(@Valid @RequestBody FacebookLoginRequest req) {
        return social(socialAuth.login(facebook.verify(req.accessToken())));
    }

    /** MH-13: chọn vai trò lần đầu. 201 + token; 400 signupToken hết hạn; 409 email đã dùng. */
    @PostMapping("/social/complete")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse completeSocial(@Valid @RequestBody SocialCompleteRequest req) {
        return socialAuth.complete(req);
    }

    /** PB-19: luôn 202 cùng một câu, dù email có tồn tại hay không. */
    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        passwordReset.forgot(req.email());
        return new MessageResponse(PasswordResetService.SENT_MESSAGE);
    }

    /** PB-19: 200 đổi xong; 400 mã sai / hết hạn (15 phút) / đã dùng hoặc mật khẩu không hợp lệ. */
    @PostMapping("/reset-password")
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        passwordReset.reset(req.token(), req.newPassword());
        return new MessageResponse("Đã đổi mật khẩu, mời bạn đăng nhập bằng mật khẩu mới");
    }

    private static ResponseEntity<?> social(SocialAuthService.Result r) {
        return r.login() != null
                ? ResponseEntity.ok(r.login())
                : ResponseEntity.status(HttpStatus.ACCEPTED).body(r.signup());
    }
}
