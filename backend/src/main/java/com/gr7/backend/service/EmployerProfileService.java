package com.gr7.backend.service;

import com.gr7.backend.dto.EmployerProfileRequest;
import com.gr7.backend.dto.EmployerProfileResponse;
import com.gr7.backend.entity.EmployerProfile;
import com.gr7.backend.exception.ApiException;
import com.gr7.backend.repository.EmployerProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Hồ sơ nhà tuyển dụng (PB-04). */
@Service
public class EmployerProfileService {

    private final EmployerProfileRepository employers;

    public EmployerProfileService(EmployerProfileRepository employers) {
        this.employers = employers;
    }

    @Transactional(readOnly = true)
    public EmployerProfileResponse getMine(Long userId) {
        return EmployerProfileResponse.from(find(userId));
    }

    @Transactional
    public EmployerProfileResponse updateMine(Long userId, EmployerProfileRequest req) {
        EmployerProfile p = find(userId);
        p.setCompanyName(req.companyName().trim());
        p.setDescription(StudentProfileService.blankToNull(req.description()));
        p.setContactEmail(StudentProfileService.blankToNull(req.contactEmail()));
        p.setContactPhone(StudentProfileService.blankToNull(req.contactPhone()));
        p.setAddress(StudentProfileService.blankToNull(req.address()));
        return EmployerProfileResponse.from(p);
    }

    private EmployerProfile find(Long userId) {
        return employers.findByUserId(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ nhà tuyển dụng"));
    }
}
