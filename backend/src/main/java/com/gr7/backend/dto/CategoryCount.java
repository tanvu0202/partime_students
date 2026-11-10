package com.gr7.backend.dto;

/** Số tin đang tuyển theo từng ngành nghề – hiển thị ở mục "Ngành nghề nổi bật" trên trang chủ. */
public record CategoryCount(String category, Long count) {}
