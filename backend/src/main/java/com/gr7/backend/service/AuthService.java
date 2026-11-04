package com.gr7.backend.service;

import com.gr7.backend.dto.AuthResponse;
import com.gr7.backend.dto.LoginRequest;
import com.gr7.backend.dto.RegisterRequest;
import com.gr7.backend.dto.UserResponse;
import com.gr7.backend.entity.EmployerProfile;
import com.gr7.backend.entity.Role;
import com.gr7.backend.entity.StudentProfile;
import com.gr7.backend.entity.User;
import com.gr7.backend.entity.UserStatus;
import com.gr7.backend.exception.ApiException;
import com.gr7.backend.repository.EmployerProfileRepository;
import com.gr7.backend.repository.StudentProfileRepository;
import com.gr7.backend.repository.UserRepository;
import com.gr7.backend.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Đăng ký, đăng nhập, lấy thông tin người đang đăng nhập (PB-01, PB-02). */
@Service
public class AuthService {

    private final UserRepository users;
    private final StudentProfileRepository students;
    private final EmployerProfileRepository employers;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository users, StudentProfileRepository students,
                       EmployerProfileRepository employers, PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.users = users;
        this.students = students;
        this.employers = employers;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /** Tạo tài khoản + hồ sơ rỗng tương ứng vai trò. Email trùng → 409. */
    @Transactional
    public UserResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email đã được sử dụng");
        }
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setFullName(req.fullName().trim());
        user.setRole(Role.valueOf(req.role()));
        user = users.save(user);

        if (user.getRole() == Role.STUDENT) {
            StudentProfile p = new StudentProfile();
            p.setUser(user);
            students.save(p);
        } else {
            EmployerProfile p = new EmployerProfile();
            p.setUser(user);
            p.setCompanyName(user.getFullName());   // company_name NOT NULL – tạm lấy họ tên, NTD sửa sau
            p.setContactEmail(email);
            employers.save(p);
        }
        return UserResponse.from(user);
    }

    /** Sai email hoặc mật khẩu → 401 (không nói rõ sai cái nào); tài khoản bị khóa → 403. */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        User user = users.findByEmail(req.email().trim().toLowerCase())
                .filter(u -> passwordEncoder.matches(req.password(), u.getPasswordHash()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng"));
        if (user.getStatus() == UserStatus.LOCKED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên");
        }
        return new AuthResponse(jwtService.createToken(user), user.getId(), user.getEmail(),
                user.getRole().name(), user.getFullName());
    }

    @Transactional(readOnly = true)
    public UserResponse me(Long userId) {
        return users.findById(userId).map(UserResponse::from)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Tài khoản không còn tồn tại"));
    }
}
