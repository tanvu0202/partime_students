# Hướng dẫn deploy PartTimeSV (bản chạy online)

Mô hình đang dùng:
- **Frontend**: Vercel, build từ thư mục `frontend` (`frontend/vercel.json` chuyển mọi đường dẫn về `index.html` cho React Router).
- **Backend**: Render Web Service (gói miễn phí), build từ `backend/Dockerfile` trên máy chủ của Render (máy nhóm không cần cài Docker).
- **CSDL**: MySQL trên cloud, backend kết nối qua biến `SPRING_DATASOURCE_URL`.
- **File CV**: Cloudinary (gói miễn phí); chưa cấu hình thì lưu tạm trên máy chủ backend.
- **Email**: API Brevo (Render gói miễn phí chặn cổng SMTP 25, 465, 587).

Mật khẩu, khóa bí mật chỉ nhập ở trang quản trị của từng dịch vụ, không ghi vào repo.

## 1. Biến môi trường của backend (Render → dịch vụ backend → Environment)
| Biến | Ý nghĩa | Bắt buộc |
|---|---|---|
| `SPRING_DATASOURCE_URL` | Chuỗi JDBC tới MySQL cloud | Có |
| `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` | Tài khoản MySQL cloud | Có |
| `APP_JWT_SECRET` | Chuỗi bí mật ký JWT, ít nhất 32 ký tự | Có |
| `APP_CORS_ALLOWED_ORIGINS` | Địa chỉ frontend trên Vercel, ví dụ `https://<ten-du-an>.vercel.app` | Có |
| `FRONTEND_URL` | Địa chỉ frontend, dùng tạo đường dẫn trong email | Có |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Lưu file CV lên Cloudinary | Nên có |
| `BREVO_API_KEY`, `MAIL_FROM` | Gửi email qua Brevo; `MAIL_FROM` dạng `PartTimeSV <địa chỉ đã xác minh trong Brevo>` | Nên có (Sprint 5) |
| `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` | Đăng nhập Facebook | Không (Sprint 5) |

`PORT` do Render tự đặt; `application.properties` đã đọc `server.port=${PORT:8080}`.

## 2. Biến môi trường của frontend (Vercel → Project → Settings → Environment Variables)
| Biến | Giá trị |
|---|---|
| `VITE_API_URL` | Địa chỉ backend trên Render, ví dụ `https://<ten-backend>.onrender.com` |
| `VITE_FACEBOOK_APP_ID` | App ID Facebook (không bắt buộc) |

Đổi biến xong phải bấm **Redeploy** để Vite build lại.

## 3. Việc cần làm khi merge code Sprint 5
1. Render: thêm `BREVO_API_KEY`, `MAIL_FROM` (và `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` nếu dùng Facebook). Render tự deploy lại khi lưu biến hoặc khi có commit mới trên nhánh đã chọn.
2. Vercel: thêm `VITE_FACEBOOK_APP_ID` nếu dùng Facebook rồi Redeploy.
3. CSDL: backend dùng `spring.jpa.hibernate.ddl-auto=update` nên tự thêm cột `users.email_notify` (mặc định bật) và bảng `job_reports` nếu chưa có; không cần chạy script nâng cấp.
4. Brevo: đăng ký https://www.brevo.com (gói Free) → Senders → xác minh địa chỉ gửi → SMTP & API → API Keys → tạo khóa.
5. Facebook: ứng dụng Facebook → App Domains thêm tên miền Vercel; Facebook Login → Allowed Domains for the JavaScript SDK thêm địa chỉ Vercel.
6. Google: Google Cloud Console → Credentials → Client ID → Authorized JavaScript origins phải có địa chỉ Vercel.

## 4. Kiểm tra sau khi deploy
1. Mở `https://<ten-backend>.onrender.com/api/hello` (lần đầu chờ khoảng 1 phút nếu backend đang ngủ).
2. Mở địa chỉ Vercel, đăng nhập `admin@gr7.vn` / `12345678`.
3. Nạp dữ liệu demo: chạy `backend/docs/seed_demo.sql` trên CSDL cloud bằng MySQL Workbench.
4. Postman: import `docs/postman/GR7_Online.postman_environment.json`, sửa `baseUrl` thành địa chỉ backend, chạy collection.

## 5. Giới hạn gói miễn phí và việc trước buổi báo cáo
- Backend Render ngủ sau 15 phút không có truy cập: mở `/api/hello` trước khi demo 5 phút.
- Link công khai: sau buổi báo cáo nên đổi mật khẩu tài khoản admin mẫu.
