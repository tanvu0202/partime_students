package com.gr7.backend.service;

import com.gr7.backend.dto.StudentProfileRequest;
import com.gr7.backend.dto.StudentProfileResponse;
import com.gr7.backend.entity.StudentProfile;
import com.gr7.backend.entity.User;
import com.gr7.backend.exception.ApiException;
import com.gr7.backend.repository.StudentProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/** Hồ sơ sinh viên (PB-03). Mọi thao tác chỉ trên hồ sơ của chính người đang đăng nhập. */
@Service
public class StudentProfileService {

    private final StudentProfileRepository students;
    private final FileStorageService files;

    public StudentProfileService(StudentProfileRepository students, FileStorageService files) {
        this.students = students;
        this.files = files;
    }

    @Transactional(readOnly = true)
    public StudentProfileResponse getMine(Long userId) {
        return StudentProfileResponse.from(find(userId));
    }

    @Transactional
    public StudentProfileResponse updateMine(Long userId, StudentProfileRequest req) {
        StudentProfile p = find(userId);
        User u = p.getUser();
        u.setFullName(req.fullName().trim());
        u.setPhone(blankToNull(req.phone()));
        p.setSchool(blankToNull(req.school()));
        p.setMajor(blankToNull(req.major()));
        p.setSkills(blankToNull(req.skills()));
        p.setBio(blankToNull(req.bio()));
        return StudentProfileResponse.from(p);
    }

    @Transactional
    public String uploadCv(Long userId, MultipartFile file) {
        StudentProfile p = find(userId);
        String url = files.saveCv(userId, file);
        p.setCvUrl(url);
        return url;
    }

    private StudentProfile find(Long userId) {
        return students.findByUserId(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ sinh viên"));
    }

    static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}
