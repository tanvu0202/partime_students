package com.gr7.backend.dto;

import com.gr7.backend.entity.EmployerProfile;

public record EmployerProfileResponse(Long id, String email, String companyName, String description,
                                      String contactEmail, String contactPhone, String address) {

    public static EmployerProfileResponse from(EmployerProfile p) {
        return new EmployerProfileResponse(p.getId(), p.getUser().getEmail(), p.getCompanyName(),
                p.getDescription(), p.getContactEmail(), p.getContactPhone(), p.getAddress());
    }
}
