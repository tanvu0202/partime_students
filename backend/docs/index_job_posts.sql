-- Index phục vụ tìm kiếm tin (NFR-01: < 2 giây với 1.000 tin)
-- Bảng job_posts đã có sẵn idx_job_category, idx_job_location, idx_job_salary (script tạo bảng ban đầu).
-- Thêm index cho điều kiện luôn có (status, hidden) và cách sắp xếp mặc định (mới nhất trước).
USE parttime_db;

CREATE INDEX idx_job_open_newest ON job_posts (status, hidden, created_at);
CREATE INDEX idx_job_employer_created ON job_posts (employer_id, created_at);

-- Kiểm tra: phải thấy 2 index mới trong danh sách
SHOW INDEX FROM job_posts;
