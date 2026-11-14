-- =====================================================================
-- GR7 – PartTimeSV – Script tạo cơ sở dữ liệu parttime_db (MySQL 8.0)
-- Khớp ERD_GR7 và từ điển dữ liệu (Tài liệu thiết kế, Mục 4)
-- Chạy: MySQL Workbench → File → Open SQL Script → bấm tia sét (Execute)
-- Dùng cho database parttime_db ĐÃ TẠO SẴN (không xóa database, không đụng user gr7)
-- Chạy lại nhiều lần được: các bảng cũ sẽ bị xóa và tạo lại (mất dữ liệu trong bảng)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS parttime_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE parttime_db;

-- Xóa bảng cũ (nếu có) theo thứ tự ngược khóa ngoại
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS job_reports, saved_jobs, password_reset_tokens, social_accounts,
                     notifications, reviews, applications, job_posts, employer_profiles, student_profiles, users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Tài khoản đăng nhập của cả 3 vai trò (FR-01, FR-02, FR-03, FR-18, FR-25)
CREATE TABLE users (
  id             BIGINT       NOT NULL AUTO_INCREMENT,
  email          VARCHAR(255) NOT NULL,
  password_hash  VARCHAR(255) NULL,                     -- BCrypt; NULL nếu chỉ đăng nhập bằng Google/Facebook
  role           ENUM('STUDENT','EMPLOYER','ADMIN') NOT NULL,
  full_name      VARCHAR(100) NOT NULL,
  phone          VARCHAR(20)  NULL,
  status         ENUM('ACTIVE','LOCKED') NOT NULL DEFAULT 'ACTIVE',
  email_notify   BOOLEAN      NOT NULL DEFAULT TRUE,    -- nhận email khi trạng thái đơn thay đổi
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NULL     ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- 2. Hồ sơ sinh viên – quan hệ 1–1 với users (FR-04, FR-26)
CREATE TABLE student_profiles (
  id              BIGINT       NOT NULL AUTO_INCREMENT,
  user_id         BIGINT       NOT NULL,
  school          VARCHAR(150) NULL,
  major           VARCHAR(100) NULL,
  skills          VARCHAR(500) NULL,
  bio             TEXT         NULL,
  cv_url          VARCHAR(255) NULL,                    -- file PDF/DOCX ≤ 5MB
  free_slots      INT          NOT NULL DEFAULT 0,      -- lịch rảnh: 21 bit = 7 ngày x 3 buổi
  preferred_area  VARCHAR(150) NULL,                    -- khu vực muốn làm, vd: Bình Thạnh
  PRIMARY KEY (id),
  UNIQUE KEY uq_student_user (user_id),
  CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Hồ sơ nhà tuyển dụng – quan hệ 1–1 với users (FR-05)
CREATE TABLE employer_profiles (
  id             BIGINT       NOT NULL AUTO_INCREMENT,
  user_id        BIGINT       NOT NULL,
  company_name   VARCHAR(150) NOT NULL,
  description    TEXT         NULL,
  contact_email  VARCHAR(255) NULL,
  contact_phone  VARCHAR(20)  NULL,
  address        VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_employer_user (user_id),
  CONSTRAINT fk_employer_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Tin việc làm part-time (FR-06 → FR-10, FR-15, FR-19, FR-26)
-- shift_slots: bit thứ (ngày x 3 + buổi); ngày 0 = Thứ Hai … 6 = Chủ Nhật; buổi 0 = Sáng, 1 = Chiều, 2 = Tối
-- Lọc theo thời gian làm: (shift_slots & mặt nạ) <> 0
CREATE TABLE job_posts (
  id           BIGINT        NOT NULL AUTO_INCREMENT,
  employer_id  BIGINT        NOT NULL,
  title        VARCHAR(200)  NOT NULL,
  description  TEXT          NOT NULL,
  category     VARCHAR(100)  NOT NULL,
  location     VARCHAR(150)  NOT NULL,
  salary_min   DECIMAL(12,0) NULL,
  salary_max   DECIMAL(12,0) NULL,
  salary_unit  ENUM('HOUR','DAY','MONTH','PROJECT') NOT NULL,
  work_time    VARCHAR(200)  NOT NULL,                  -- chuỗi hiển thị, vd: 18:00–22:00, T2–T6
  shift_slots  INT           NOT NULL DEFAULT 0,        -- ca làm: 21 bit = 7 ngày x 3 buổi
  slots        INT           NOT NULL DEFAULT 1,
  status       ENUM('OPEN','FILLED','COMPLETED','CLOSED') NOT NULL DEFAULT 'OPEN',
  hidden       BOOLEAN       NOT NULL DEFAULT FALSE,    -- admin gỡ tin
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NULL     ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_job_category (category),
  KEY idx_job_location (location),
  KEY idx_job_salary (salary_min),
  KEY idx_job_shift (shift_slots),
  KEY idx_job_open_newest (status, hidden, created_at),   -- NFR-01: tìm tin đang mở, mới nhất trước
  KEY idx_job_employer_created (employer_id, created_at),
  CONSTRAINT fk_job_employer FOREIGN KEY (employer_id) REFERENCES employer_profiles(id),
  CONSTRAINT ck_job_salary_min CHECK (salary_min IS NULL OR salary_min >= 0),
  CONSTRAINT ck_job_salary_range CHECK (salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min),
  CONSTRAINT ck_job_slots CHECK (slots >= 1)
) ENGINE=InnoDB;

-- 5. Đơn ứng tuyển (FR-11 → FR-14)
CREATE TABLE applications (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  job_id        BIGINT       NOT NULL,
  student_id    BIGINT       NOT NULL,
  cover_letter  TEXT         NULL,
  cv_url        VARCHAR(255) NULL,                      -- sao chép từ hồ sơ lúc nộp
  status        ENUM('PENDING','ACCEPTED','REJECTED') NOT NULL DEFAULT 'PENDING',
  applied_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NULL     ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_app_job_student (job_id, student_id),   -- chặn ứng tuyển trùng
  CONSTRAINT fk_app_job     FOREIGN KEY (job_id)     REFERENCES job_posts(id),
  CONSTRAINT fk_app_student FOREIGN KEY (student_id) REFERENCES student_profiles(id)
) ENGINE=InnoDB;

-- 6. Đánh giá hai chiều (FR-16) – mỗi bên đánh giá 1 lần cho mỗi đơn
CREATE TABLE reviews (
  id              BIGINT       NOT NULL AUTO_INCREMENT,
  application_id  BIGINT       NOT NULL,
  reviewer_id     BIGINT       NOT NULL,
  reviewee_id     BIGINT       NOT NULL,
  rating          TINYINT      NOT NULL,
  comment         VARCHAR(500) NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_review_app_reviewer (application_id, reviewer_id),
  CONSTRAINT fk_review_app      FOREIGN KEY (application_id) REFERENCES applications(id),
  CONSTRAINT fk_review_reviewer FOREIGN KEY (reviewer_id)    REFERENCES users(id),
  CONSTRAINT fk_review_reviewee FOREIGN KEY (reviewee_id)    REFERENCES users(id),
  CONSTRAINT ck_review_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- 7. Thông báo (FR-17)
CREATE TABLE notifications (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  user_id     BIGINT       NOT NULL,
  type        ENUM('NEW_APPLICATION','APPLICATION_ACCEPTED','APPLICATION_REJECTED','JOB_STATUS_CHANGED') NOT NULL,
  message     VARCHAR(255) NOT NULL,
  link        VARCHAR(255) NULL,
  is_read     BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notif_user_read (user_id, is_read),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Liên kết tài khoản Google / Facebook (FR-20, FR-21)
CREATE TABLE social_accounts (
  id                BIGINT       NOT NULL AUTO_INCREMENT,
  user_id           BIGINT       NOT NULL,
  provider          ENUM('GOOGLE','FACEBOOK') NOT NULL,
  provider_user_id  VARCHAR(100) NOT NULL,              -- mã tài khoản do Google/Facebook cấp
  email             VARCHAR(255) NULL,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_social_provider_user (provider, provider_user_id),
  CONSTRAINT fk_social_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. Mã đặt lại mật khẩu (FR-22) – chỉ lưu SHA-256, hạn 15 phút
CREATE TABLE password_reset_tokens (
  id          BIGINT    NOT NULL AUTO_INCREMENT,
  user_id     BIGINT    NOT NULL,
  token_hash  CHAR(64)  NOT NULL,
  expires_at  DATETIME  NOT NULL,
  used_at     DATETIME  NULL,                           -- khác NULL = đã dùng
  created_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reset_token (token_hash),
  CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. Việc đã lưu (FR-23)
CREATE TABLE saved_jobs (
  id          BIGINT    NOT NULL AUTO_INCREMENT,
  student_id  BIGINT    NOT NULL,
  job_id      BIGINT    NOT NULL,
  created_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_saved_student_job (student_id, job_id),
  CONSTRAINT fk_saved_student FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_saved_job     FOREIGN KEY (job_id)     REFERENCES job_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. Báo cáo tin đáng ngờ (FR-24)
CREATE TABLE job_reports (
  id           BIGINT       NOT NULL AUTO_INCREMENT,
  job_id       BIGINT       NOT NULL,
  reporter_id  BIGINT       NOT NULL,
  reason       ENUM('DEPOSIT','FALSE_INFO','SCAM','OTHER') NOT NULL,
  description  VARCHAR(500) NULL,
  status       ENUM('PENDING','RESOLVED','DISMISSED') NOT NULL DEFAULT 'PENDING',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  handled_at   DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_report_job_reporter (job_id, reporter_id),
  KEY idx_report_status (status),
  CONSTRAINT fk_report_job      FOREIGN KEY (job_id)      REFERENCES job_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_report_reporter FOREIGN KEY (reporter_id) REFERENCES student_profiles(id)
) ENGINE=InnoDB;

-- Kiểm tra: phải thấy 11 bảng
SHOW TABLES;

-- Ghi chú: tài khoản mẫu (admin, SV, NTD) nên tạo qua API POST /api/auth/register
-- để mật khẩu được mã hóa BCrypt đúng cách; không chèn mật khẩu thô vào bảng users.
