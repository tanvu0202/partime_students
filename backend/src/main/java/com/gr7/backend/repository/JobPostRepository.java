package com.gr7.backend.repository;

import com.gr7.backend.dto.CategoryCount;
import com.gr7.backend.entity.JobPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface JobPostRepository extends JpaRepository<JobPost, Long>, JpaSpecificationExecutor<JobPost> {
    Page<JobPost> findByEmployerId(Long employerId, Pageable pageable);

    /** Trang "Tin của tôi": tin mới nhất lên đầu. */
    List<JobPost> findByEmployerIdOrderByCreatedAtDesc(Long employerId);

    /** Đếm tin đang tuyển theo ngành nghề, nhiều tin nhất lên đầu. */
    @Query("""
            select new com.gr7.backend.dto.CategoryCount(j.category, count(j))
            from JobPost j
            where j.status = com.gr7.backend.entity.JobStatus.OPEN and j.hidden = false
            group by j.category
            order by count(j) desc
            """)
    List<CategoryCount> countOpenByCategory();
}
