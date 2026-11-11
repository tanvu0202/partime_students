-- Sinh 1.000 tin giả để đo hiệu năng tìm kiếm (NFR-01: < 2 giây với 1.000 tin)
-- Chạy trong MySQL Workbench SAU KHI backend đã chạy ít nhất 1 lần (đã có dữ liệu mẫu 3 nhà tuyển dụng).
-- Tin giả có tiêu đề bắt đầu bằng "[Test hiệu năng]" để dễ xóa sau khi đo (xem cuối file).
USE parttime_db;
SET SESSION cte_max_recursion_depth = 2000;

INSERT INTO job_posts (employer_id, title, description, category, location,
                       salary_min, salary_max, salary_unit, work_time, slots, status, hidden, created_at)
WITH RECURSIVE seq (n) AS (
    SELECT 1
    UNION ALL
    SELECT n + 1 FROM seq WHERE n < 1000
),
emp AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) - 1 AS k, COUNT(*) OVER () AS total
    FROM employer_profiles
)
SELECT emp.id,
       CONCAT('[Test hiệu năng] ',
              ELT(seq.n % 7 + 1, 'Phục vụ quán cà phê', 'Bán hàng cửa hàng', 'Nhập liệu', 'Gia sư',
                                 'Hỗ trợ sự kiện', 'Giao hàng', 'Trực fanpage'),
              ' #', seq.n),
       CONCAT('Tin giả số ', seq.n, ' dùng để đo thời gian tìm kiếm. Ca linh hoạt, ưu tiên sinh viên.'),
       ELT(seq.n % 7 + 1, 'F&B', 'Bán hàng', 'Nhập liệu', 'Gia sư', 'Sự kiện – PG', 'Giao hàng', 'Khác'),
       ELT(seq.n % 6 + 1, 'Bình Thạnh, TP.HCM', 'Gò Vấp, TP.HCM', 'Quận 1, TP.HCM', 'Quận 3, TP.HCM',
                          'Phú Nhuận, TP.HCM', 'Thủ Đức, TP.HCM'),
       20000 + (seq.n % 15) * 1000,
       25000 + (seq.n % 15) * 1000,
       'HOUR',
       ELT(seq.n % 3 + 1, '18:00–22:00, T2–T6', 'T7–CN, 8:00–14:00', 'Linh hoạt'),
       seq.n % 5 + 1,
       'OPEN',
       0,
       NOW() - INTERVAL seq.n MINUTE
FROM seq
JOIN emp ON emp.k = seq.n % emp.total;

-- Kiểm tra: phải thấy khoảng 1.020 tin đang mở
SELECT COUNT(*) AS so_tin_dang_mo FROM job_posts WHERE status = 'OPEN' AND hidden = 0;

-- Đo bằng Postman: GET {{baseUrl}}/api/jobs?keyword=phục vụ&category=F%26B&page=0&size=10
-- Ghi thời gian (ms) ở góc phải khung kết quả vào bảng đo trong báo cáo.

-- Đo xong, muốn xóa tin giả thì bỏ dấu -- ở dòng dưới rồi chạy:
-- DELETE FROM job_posts WHERE title LIKE '[Test hiệu năng]%';
