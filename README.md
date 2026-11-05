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

## Cấu trúc thư mục
```
backend/    Spring Boot (REST API)        – chạy ở http://localhost:8080
frontend/   React + Vite (giao diện)      – chạy ở http://localhost:5173
backend/docs/create_db.sql            tạo database parttime_db + user gr7
backend/docs/parttime_db_schema.sql   tạo 7 bảng theo ERD
docs/postman/                          Postman collection + environment
```

## Cách chạy trên máy
1. **Database** – mở MySQL Workbench bằng tài khoản root, chạy lần lượt
   `backend/docs/create_db.sql` rồi `backend/docs/parttime_db_schema.sql`.
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

Gửi kèm header `Authorization: Bearer <token>` với mọi API trừ đăng ký, đăng nhập.
Lỗi trả về dạng `{ "status": 400, "message": "...", "errors": { "tênTrường": "lý do" } }`.

## Quy ước làm việc với Git
- `main`: bản ổn định để nộp/demo · `develop`: bản tích hợp hằng ngày
- Mỗi chức năng một nhánh `feature/...` tách từ `develop`, xong thì tạo Pull Request vào `develop`
- Commit message tiếng Việt không dấu, ngắn gọn, ví dụ `Them API dang ky dang nhap`
