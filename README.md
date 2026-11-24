# PartTimeSV – Nền tảng việc làm part-time cho sinh viên

Đồ án môn **Chuyên đề tốt nghiệp 2** – Trường Đại học Văn Lang
Nhóm **GR7** · GVHD: ThS. Nguyễn Văn Trung

| Thành viên | Vai trò chính |
|---|---|
| Trần Tấn Vũ (nhóm trưởng) | Kiến trúc, bảo mật, API xác thực – hồ sơ – tin việc làm |
| Nguyễn Trọng Hải | Cơ sở dữ liệu, API ứng tuyển – đánh giá – thông báo |
| Văn Ngọc Minh Huy | Giao diện React, luồng màn hình |

## Công nghệ
- Backend: Java 21, Spring Boot 4.1, Spring Security (JWT), Spring Data JPA
- Cơ sở dữ liệu: MySQL 8.0
- Frontend: React + Vite, React Router, Axios
- Kiểm thử API: Postman (`docs/postman/`)
- Triển khai: Vercel (frontend), Render (backend), MySQL cloud, Cloudinary (file CV)

## Cấu trúc thư mục
```
backend/    Spring Boot (REST API)        – chạy ở http://localhost:8080
frontend/   React + Vite (giao diện)      – chạy ở http://localhost:5173
backend/docs/create_db.sql            tạo database parttime_db + user gr7
backend/docs/parttime_db_schema.sql   tạo 11 bảng theo ERD (máy cài mới, xóa dữ liệu cũ)
backend/docs/nang_cap_database.sql    nâng cấp database đang có lên cấu trúc mới, giữ dữ liệu
backend/docs/seed_demo.sql            dữ liệu demo cho buổi báo cáo (chạy sau khi backend tạo dữ liệu mẫu)
backend/config/application.properties.example   mẫu cấu hình bí mật trên từng máy (Gmail, Facebook)
frontend/vercel.json, backend/Dockerfile   cấu hình deploy Vercel, Render
docs/postman/                          Postman collection + environment
```

## Cách chạy trên máy
1. **Database** – mở MySQL Workbench bằng tài khoản root, chạy lần lượt
   `backend/docs/create_db.sql` rồi `backend/docs/parttime_db_schema.sql`.
   Máy đã có database từ trước: chỉ chạy `backend/docs/nang_cap_database.sql` (giữ dữ liệu, chạy lại nhiều lần được).
2. **Backend** – trong thư mục `backend`:
   ```bash
   ./mvnw spring-boot:run
   ```
   Lần chạy đầu tiên tự tạo dữ liệu mẫu (xem bảng dưới).
3. **Frontend** – trong thư mục `frontend`:
   ```bash
   npm install
   npm run dev
   ```
   Mở http://localhost:5173
4. **Dữ liệu demo (tùy chọn)** – sau khi backend chạy lần đầu, mở MySQL Workbench chạy
   `backend/docs/seed_demo.sql`: thêm tin chờ duyệt, tin bị từ chối, đơn ở đủ trạng thái, đánh giá, báo cáo tin.

## Bản chạy online (deploy)
- Frontend trên Vercel (`frontend/vercel.json`), backend trên Render (build từ `backend/Dockerfile`), CSDL MySQL trên cloud, file CV trên Cloudinary.
- Biến môi trường và các bước: `docs/HuongDanDeploy.md`.
- Render gói miễn phí: backend ngủ sau 15 phút không có truy cập (lần mở đầu chờ khoảng 1 phút) và chặn cổng SMTP nên email gửi qua API của Brevo (`BREVO_API_KEY`).

## Cấu hình bí mật trên từng máy (tùy chọn)
Copy `backend/config/application.properties.example` thành `backend/config/application.properties` (đã bị `.gitignore` chặn) rồi bỏ dấu `#` ở phần cần dùng:
- **Gửi email** (quên mật khẩu, email khi trạng thái đơn thay đổi): Gmail bật Xác minh 2 bước, tạo Mật khẩu ứng dụng 16 ký tự tại https://myaccount.google.com/apppasswords. Chưa cấu hình thì nội dung email in ra terminal của backend.
- **Đăng nhập Facebook**: tạo ứng dụng tại https://developers.facebook.com (loại Consumer, thêm sản phẩm Facebook Login, thêm `http://localhost:5173` vào Allowed Domains for the JavaScript SDK), lấy App ID và App Secret. App ID đặt thêm ở `frontend/.env`: `VITE_FACEBOOK_APP_ID=...`. App Secret chỉ để trong file cấu hình riêng, không commit.

Chạy backend bằng `./mvnw spring-boot:run` trong thư mục `backend` để Spring Boot đọc được `config/application.properties`.

## Tài khoản mẫu (mật khẩu chung: `12345678`)
| Vai trò | Email |
|---|---|
| Quản trị viên | admin@gr7.vn |
| Nhà tuyển dụng | ntd1@gr7.vn, ntd2@gr7.vn, ntd3@gr7.vn |
| Sinh viên | sv1@gr7.vn … sv5@gr7.vn |

## API đã có (Sprint 2)
| Phương thức | Đường dẫn | Ai gọi được |
|---|---|---|
| POST | /api/auth/register | Khách |
| POST | /api/auth/login | Khách |
| GET | /api/auth/me | Đã đăng nhập |
| GET, PUT | /api/students/me | Sinh viên |
| POST | /api/students/me/cv | Sinh viên (PDF/DOCX ≤ 5MB) |
| GET, PUT | /api/employers/me | Nhà tuyển dụng |

## API đã có (Sprint 3)
| Phương thức | Đường dẫn | Ai gọi được |
|---|---|---|
| GET | /api/jobs?keyword=&category=&location=&minSalary=&maxSalary=&salaryUnit=&sort=newest\|salary&page=0&size=10 | Ai cũng gọi được |
| GET | /api/jobs/{id}, /api/jobs/categories | Ai cũng gọi được |
| POST | /api/jobs | Nhà tuyển dụng |
| PUT, DELETE | /api/jobs/{id} | Nhà tuyển dụng (chủ tin) |
| PATCH | /api/jobs/{id}/close | Nhà tuyển dụng (chủ tin) |
| GET | /api/employers/me/jobs, /api/employers/me/jobs/{id} | Nhà tuyển dụng |
| POST | /api/jobs/{id}/applications | Sinh viên |
| GET | /api/applications/me | Sinh viên |
| GET | /api/jobs/{id}/applications | Nhà tuyển dụng (chủ tin) |
| PATCH | /api/applications/{id}/status (body `{"status":"ACCEPTED"}` hoặc `REJECTED`) | Nhà tuyển dụng (chủ tin) |

## API thêm ở Sprint 4–5
| Phương thức | Đường dẫn | Ai gọi được |
|---|---|---|
| PATCH | /api/jobs/{id}/status | Nhà tuyển dụng (chủ tin) |
| POST | /api/applications/{id}/reviews · GET /api/users/{id}/reviews, /api/reviews/me | SV, NTD |
| GET, PATCH | /api/notifications/me, /api/notifications/{id}/read, /api/notifications/me/read-all | Đã đăng nhập |
| GET, PATCH | /api/admin/users, /api/admin/users/{id}, …/lock, …/unlock | Quản trị viên |
| GET, PATCH | /api/admin/jobs, /api/admin/jobs/{id}, …/approve, …/reject, …/hide, …/unhide | Quản trị viên |
| POST | /api/auth/google, /api/auth/facebook, /api/auth/social/complete | Khách |
| POST | /api/auth/forgot-password, /api/auth/reset-password | Khách |
| GET, PUT, DELETE | /api/students/me/saved-jobs, …/saved-jobs/{jobId} | Sinh viên |
| GET, PUT | /api/students/me/availability · GET /api/students/me/matched-jobs | Sinh viên |
| POST | /api/jobs/{id}/reports | Sinh viên |
| GET, PATCH | /api/admin/reports, /api/admin/reports/{id} (body `{"action":"HIDE_JOB"}` hoặc `DISMISS`) | Quản trị viên |
| PATCH | /api/users/me/email-settings (body `{"emailNotify":true}`) | SV, NTD |

Script bổ sung (chạy trong MySQL Workbench):
- `docs/sql/seed_1000_jobs.sql` – sinh 1.000 tin giả để đo tốc độ tìm kiếm (NFR-01 < 2 giây)

Gửi kèm header `Authorization: Bearer <token>` với mọi API trừ đăng ký, đăng nhập.
Lỗi trả về dạng `{ "status": 400, "message": "...", "errors": { "tênTrường": "lý do" } }`.

## Quy ước làm việc với Git
- `main`: bản ổn định để nộp/demo · `develop`: bản tích hợp hằng ngày
- Mỗi chức năng một nhánh `feature/...` tách từ `develop`, xong thì tạo Pull Request vào `develop`
- Commit message tiếng Việt không dấu, ngắn gọn, ví dụ `Them API dang ky dang nhap`
