-- GR7 – Nâng cấp database đang có lên ERD CR-01, GIỮ NGUYÊN dữ liệu cũ
-- Chỉ chạy 1 lần. Dùng khi không muốn chạy lại parttime_db_schema.sql (script đó xóa hết dữ liệu).
USE parttime_db;

ALTER TABLE users
  MODIFY password_hash VARCHAR(255) NULL,
  ADD COLUMN email_notify BOOLEAN NOT NULL DEFAULT TRUE AFTER status;

ALTER TABLE student_profiles
  ADD COLUMN free_slots INT NOT NULL DEFAULT 0,
  ADD COLUMN preferred_area VARCHAR(150) NULL;

ALTER TABLE job_posts
  ADD COLUMN shift_slots INT NOT NULL DEFAULT 0 AFTER work_time,
  ADD KEY idx_job_shift (shift_slots);

CREATE TABLE social_accounts (
  id                BIGINT       NOT NULL AUTO_INCREMENT,
  user_id           BIGINT       NOT NULL,
  provider          ENUM('GOOGLE','FACEBOOK') NOT NULL,
  provider_user_id  VARCHAR(100) NOT NULL,
  email             VARCHAR(255) NULL,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_social_provider_user (provider, provider_user_id),
  CONSTRAINT fk_social_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE password_reset_tokens (
  id          BIGINT    NOT NULL AUTO_INCREMENT,
  user_id     BIGINT    NOT NULL,
  token_hash  CHAR(64)  NOT NULL,
  expires_at  DATETIME  NOT NULL,
  used_at     DATETIME  NULL,
  created_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reset_token (token_hash),
  CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

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
