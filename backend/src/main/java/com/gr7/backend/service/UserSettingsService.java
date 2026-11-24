package com.gr7.backend.service;

import com.gr7.backend.dto.EmailSettingsResponse;
import com.gr7.backend.entity.User;
import com.gr7.backend.exception.ApiException;
import com.gr7.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Bật / tắt nhận email khi trạng thái đơn ứng tuyển thay đổi (PB-22, FR-25). */
@Service
public class UserSettingsService {

    private final UserRepository users;

    public UserSettingsService(UserRepository users) {
        this.users = users;
    }

    @Transactional
    public EmailSettingsResponse setEmailNotify(Long userId, boolean on) {
        User u = users.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản"));
        u.setEmailNotify(on);
        return new EmailSettingsResponse(u.isEmailNotify());
    }
}
