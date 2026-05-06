# 🏥 Soyte Backend API

Backend API cho hệ thống quản lý thông tin Sở Y Tế, xây dựng bằng **Node.js**, **Express.js** và **SQL Server** thông qua Sequelize ORM. Server chạy HTTPS với hỗ trợ cron job tự động.

---

## 📋 Mục Lục

- [Tính Năng](#-tính-năng)
- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
- [Yêu Cầu Hệ Thống](#-yêu-cầu-hệ-thống)
- [Cài Đặt](#-cài-đặt)
- [Cấu Hình Môi Trường](#-cấu-hình-môi-trường)
- [Scripts](#-scripts)
- [API Endpoints](#-api-endpoints)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)

---

## ✨ Tính Năng

- 🔐 **Xác thực & Phân quyền**: JWT-based auth, phân quyền theo vai trò (`superadmin`, `admin`, `user`) và theo đơn vị
- 🏨 **Quản lý Cơ Sở Xã Hội**: CRUD cơ sở, quản lý cơ sở liên kết trực thuộc
- 📋 **Quản lý Kế Hoạch Công Tác**: Tạo, phê duyệt, xuất PDF lịch công tác với đính kèm file
- 📝 **Biểu Mẫu & Khảo Sát**: Quản lý form phản hồi nhiều phần (section/option), khảo sát tự động
- 📣 **Bài Đăng / Tin Tức**: Đăng tải, quản lý bài viết kèm hình ảnh
- 🕷️ **Crawler Dữ Liệu**: Tự động thu thập lịch công tác từ website ngoài
- 📧 **Gửi Email Xác Nhận**: Tích hợp Nodemailer để gửi OTP xác thực tài khoản
- 📁 **Upload File**: Hỗ trợ upload ảnh và tài liệu đính kèm
- ⏰ **Cron Job**: Tự động hóa các tác vụ định kỳ bằng `node-cron`
- 📤 **Xuất Excel & PDF**: Hỗ trợ xuất dữ liệu báo cáo bằng ExcelJS và PDFKit

---

## 🛠 Công Nghệ Sử Dụng

| Công nghệ | Phiên bản | Mô tả |
|-----------|-----------|-------|
| Node.js | ≥18 | Runtime |
| Express.js | ^5.2.1 | Web framework |
| Sequelize | ^6.37.7 | ORM |
| SQL Server | — | Cơ sở dữ liệu (via Tedious) |
| JWT | ^9.0.3 | Xác thực token |
| Nodemailer | ^8.0.3 | Gửi email |
| Multer | ^2.0.2 | Upload file |
| ExcelJS | ^4.4.0 | Xuất file Excel |
| PDFKit | ^0.17.2 | Xuất file PDF |
| node-cron | ^4.2.1 | Lên lịch tác vụ tự động |
| Babel | ^7.28.6 | Transpile ES6+ (build) |
| Nodemon | ^3.1.11 | Hot reload (development) |

---

## 💻 Yêu Cầu Hệ Thống

- **Node.js** >= 18.x
- **pnpm** >= 10.x (khuyến nghị) hoặc npm/yarn
- **SQL Server** đang chạy với database đã được tạo sẵn
- Chứng chỉ SSL (`key.pem`, `cert.pem`) đặt ở thư mục gốc

---

## 🚀 Cài Đặt

```bash
# 1. Clone repository
git clone <repo-url>
cd soyte_be

# 2. Cài đặt dependencies
pnpm install

# 3. Tạo file .env từ mẫu
cp .env.example .env
# → Điền thông tin vào .env (xem phần Cấu hình bên dưới)

# 4. Chạy trong môi trường development
pnpm dev
```

---

## ⚙️ Cấu Hình Môi Trường

Tạo file `.env` ở thư mục gốc với các biến sau:

```env
# Server
PORT=3000

# Database (SQL Server)
DB_HOST=localhost
DB_NAME=your_database_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_DIALECT=mssql

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

## 📜 Scripts

```bash
pnpm dev       # Chạy development server (nodemon, hot reload)
pnpm start     # Chạy production server
pnpm build     # Build sang ES5 với Babel (output: /dist)
pnpm preview   # Chạy bản build đã biên dịch
```

---

## 🔌 API Endpoints

Tất cả API đều có prefix `/api`. Server chạy trên HTTPS.

| Prefix | Mô Tả |
|--------|-------|
| `GET /` | Kiểm tra server hoạt động |
| `/api/auth` | Đăng nhập, đăng ký, verify token |
| `/api/users` | Quản lý người dùng |
| `/api/posts` | Quản lý bài đăng / tin tức |
| `/api/schedules` | Quản lý lịch công tác |
| `/api/crawled-schedules` | Lịch thu thập tự động từ web |
| `/api/forms` | Quản lý biểu mẫu |
| `/api/feedbacks` | Quản lý phản hồi / góp ý |
| `/api/surveys` | Quản lý khảo sát |
| `/api/upload` | Upload file/ảnh |
| `/api/social-facilities` | Quản lý cơ sở xã hội |
| `/api/affiliated-facilities` | Quản lý cơ sở liên kết |
| `/api/permissions` | Quản lý phân quyền theo đơn vị |
| `/api/email-confirm` | Gửi & xác thực OTP qua email |

> 📂 Xem chi tiết tất cả endpoint trong file `Soyte_BE_API_Collection.postman_collection.json` — import vào Postman để test.

---

## 📁 Cấu Trúc Dự Án

Xem chi tiết tại [`STRUCTURE.md`](./STRUCTURE.md).

---

## 📄 Giấy Phép

ISC License © 2026 FOXAI
