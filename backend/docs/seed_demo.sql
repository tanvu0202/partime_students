-- =====================================================================
-- GR7 – PartTimeSV – Dữ liệu demo cho buổi báo cáo (MySQL 8.0)
-- Chạy SAU khi backend đã khởi động một lần (backend tự tạo 1 admin, 3 NTD, 5 SV, 20 tin).
-- Bổ sung để mỗi màn hình đều có dữ liệu khi demo:
--   - 2 tin chờ duyệt, 1 tin bị từ chối (tab Tin đăng của quản trị viên, Tin của tôi của NTD)
--   - đơn ứng tuyển ở đủ 3 trạng thái, 1 tin đã hoàn thành có đánh giá hai chiều
--   - 3 báo cáo tin đáng ngờ chờ xử lý (tab Báo cáo tin)
--   - lịch rảnh tối T2–T6 cho sv1, kỹ năng chọn từ danh sách
-- Chạy lại nhiều lần được: dòng đã có thì bỏ qua (INSERT IGNORE / NOT EXISTS).
-- Mật khẩu mọi tài khoản demo: 12345678
-- =====================================================================
USE parttime_db;

SET @ntd1 = (SELECT e.id FROM employer_profiles e JOIN users u ON u.id = e.user_id WHERE u.email = 'ntd1@gr7.vn');
SET @ntd3 = (SELECT e.id FROM employer_profiles e JOIN users u ON u.id = e.user_id WHERE u.email = 'ntd3@gr7.vn');
SET @sv1 = (SELECT s.id FROM student_profiles s JOIN users u ON u.id = s.user_id WHERE u.email = 'sv1@gr7.vn');
SET @sv2 = (SELECT s.id FROM student_profiles s JOIN users u ON u.id = s.user_id WHERE u.email = 'sv2@gr7.vn');
SET @sv3 = (SELECT s.id FROM student_profiles s JOIN users u ON u.id = s.user_id WHERE u.email = 'sv3@gr7.vn');
SET @sv4 = (SELECT s.id FROM student_profiles s JOIN users u ON u.id = s.user_id WHERE u.email = 'sv4@gr7.vn');

-- 1. Hồ sơ sinh viên: kỹ năng theo danh sách, lịch rảnh tối T2–T6 (bit tối của 5 ngày đầu = 18724)
UPDATE student_profiles SET skills = 'Giao tiếp, Làm việc nhóm, Pha chế, Phục vụ', available_slots = 18724,
       bio = 'Sinh viên năm 3, rảnh buổi tối các ngày trong tuần, đã làm phục vụ quán cà phê 6 tháng.'
 WHERE id = @sv1;
UPDATE student_profiles SET skills = 'Giao tiếp, Bán hàng, Tin học văn phòng, Tiếng Anh' WHERE id = @sv2;
UPDATE student_profiles SET skills = 'Excel, Nhập liệu, Viết nội dung, Quản lý mạng xã hội' WHERE id = @sv3;
UPDATE student_profiles SET skills = 'Gia sư, Thuyết trình, Quản lý thời gian' WHERE id = @sv4;

-- 2. Tin chờ duyệt và tin bị từ chối
INSERT INTO job_posts (employer_id, title, description, category, location, salary_min, salary_max, salary_unit, work_time, slots, status)
SELECT @ntd1, 'Phục vụ quầy bánh ngọt ca tối', 'Phục vụ khách, đóng gói bánh, dọn quầy cuối ca. Được đào tạo 2 buổi đầu, có phụ cấp gửi xe.',
       'F&B', 'Bình Thạnh, TP.HCM', 26000, 30000, 'HOUR', '18:00–22:00, T2–T6', 2, 'PENDING'
 WHERE NOT EXISTS (SELECT 1 FROM job_posts WHERE title = 'Phục vụ quầy bánh ngọt ca tối');
INSERT INTO job_posts (employer_id, title, description, category, location, salary_min, salary_max, salary_unit, work_time, slots, status)
SELECT @ntd3, 'Nhập liệu đơn hàng buổi sáng', 'Nhập đơn hàng từ file Excel vào phần mềm bán hàng, kiểm tra trùng lặp.',
       'Nhập liệu', 'Gò Vấp, TP.HCM', 25000, 27000, 'HOUR', '8:00–11:00, T2–T6', 2, 'PENDING'
 WHERE NOT EXISTS (SELECT 1 FROM job_posts WHERE title = 'Nhập liệu đơn hàng buổi sáng');
INSERT INTO job_posts (employer_id, title, description, category, location, salary_min, salary_max, salary_unit, work_time, slots, status, reject_reason)
SELECT @ntd3, 'Việc nhẹ lương cao tại nhà', 'Làm tại nhà, thu nhập hấp dẫn, liên hệ để biết thêm.',
       'Khác', 'Làm từ xa', 500000, 1000000, 'DAY', 'Linh hoạt', 10, 'REJECTED',
       'Mô tả không nêu rõ công việc cụ thể và mức lương không thực tế'
 WHERE NOT EXISTS (SELECT 1 FROM job_posts WHERE title = 'Việc nhẹ lương cao tại nhà');

-- 3. Đơn ứng tuyển ở đủ trạng thái
SET @jCafe  = (SELECT id FROM job_posts WHERE title = 'Phục vụ quán cà phê ca tối' LIMIT 1);
SET @jToan  = (SELECT id FROM job_posts WHERE title = 'Gia sư Toán lớp 9' LIMIT 1);
SET @jEvent = (SELECT id FROM job_posts WHERE title = 'Hỗ trợ check-in sự kiện' LIMIT 1);
SET @jCtv   = (SELECT id FROM job_posts WHERE title = 'Cộng tác viên nhập liệu' LIMIT 1);

INSERT IGNORE INTO applications (job_id, student_id, cover_letter, status) VALUES
  (@jCafe, @sv1, 'Em rảnh tối T2–T6, đã làm phục vụ quán cà phê 6 tháng.', 'ACCEPTED'),
  (@jCafe, @sv2, 'Em muốn thử sức với công việc phục vụ, có thể làm 3 tối mỗi tuần.', 'PENDING'),
  (@jToan, @sv3, 'Em từng đạt giải Toán cấp thành phố.', 'REJECTED'),
  (@jToan, @sv4, 'Em học Sư phạm Toán năm 3, đã dạy kèm 2 học sinh lớp 9.', 'ACCEPTED'),
  (@jEvent, @sv1, 'Em có kinh nghiệm hỗ trợ sự kiện ở trường.', 'ACCEPTED');

-- 4. Tin đã hoàn thành có đánh giá hai chiều
UPDATE job_posts SET status = 'COMPLETED' WHERE id = @jEvent;
SET @appEvent = (SELECT id FROM applications WHERE job_id = @jEvent AND student_id = @sv1);
SET @uSv1 = (SELECT user_id FROM student_profiles WHERE id = @sv1);
SET @uEvt = (SELECT e.user_id FROM job_posts j JOIN employer_profiles e ON e.id = j.employer_id WHERE j.id = @jEvent);
INSERT IGNORE INTO reviews (application_id, reviewer_id, reviewee_id, rating, comment) VALUES
  (@appEvent, @uEvt, @uSv1, 5, 'Đúng giờ, nhanh nhẹn, hướng dẫn khách rất nhiệt tình.'),
  (@appEvent, @uSv1, @uEvt, 4, 'Nhà tuyển dụng trả lương đúng hẹn, hướng dẫn công việc rõ ràng.');

-- 5. Báo cáo tin đáng ngờ chờ xử lý
INSERT IGNORE INTO job_reports (job_id, reporter_id, reason, description) VALUES
  (@jCtv, @sv2, 'DEPOSIT', 'Nhà tuyển dụng yêu cầu chuyển 300.000đ phí tài liệu trước khi nhận việc.'),
  (@jCtv, @sv3, 'SCAM', 'Nhắn tin qua Zalo đòi gửi ảnh căn cước và tiền cọc.'),
  (@jCtv, @sv4, 'DEPOSIT', NULL);

SELECT 'Đã nạp dữ liệu demo' AS ket_qua,
       (SELECT COUNT(*) FROM job_posts WHERE status = 'PENDING') AS tin_cho_duyet,
       (SELECT COUNT(*) FROM applications) AS so_don,
       (SELECT COUNT(*) FROM job_reports WHERE status = 'PENDING') AS bao_cao_cho;
