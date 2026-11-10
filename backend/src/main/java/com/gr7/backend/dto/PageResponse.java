package com.gr7.backend.dto;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/** Kết quả phân trang gọn, cố định tên trường cho frontend: content, page, size, totalElements, totalPages. */
public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {

    public static <E, T> PageResponse<T> of(Page<E> p, Function<E, T> mapper) {
        return new PageResponse<>(p.getContent().stream().map(mapper).toList(),
                p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
    }
}
