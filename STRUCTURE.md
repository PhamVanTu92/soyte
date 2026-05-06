# 📁 Cấu Trúc Dự Án — Soyte Backend

Tài liệu mô tả chi tiết cấu trúc thư mục và vai trò của từng file trong dự án.

---

## 🗂 Tổng Quan

```
soyte_be/
├── src/                        # Toàn bộ source code chính
│   ├── app.js                  # Khởi tạo Express, đăng ký routes & middlewares
│   ├── server.js               # Kết nối DB, khởi động HTTPS server
│   ├── config/                 # Cấu hình kết nối
│   ├── models/                 # Định nghĩa Sequelize models (ORM)
│   ├── controllers/            # Xử lý request/response
│   ├── services/               # Business logic, truy vấn DB
│   ├── routes/                 # Định tuyến API endpoints
│   ├── middlewares/            # Xác thực, phân quyền, xử lý lỗi
│   ├── utils/                  # Hàm tiện ích dùng chung
│   └── cron/                   # Tác vụ lên lịch tự động
├── uploads/                    # Thư mục lưu file/ảnh upload
├── app.js                      # (Legacy) entry point cũ — không dùng
├── server.js                   # (Legacy) server cũ — không dùng
├── key.pem                     # SSL private key
├── cert.pem                    # SSL certificate
├── .env                        # Biến môi trường (không commit)
├── .gitignore
├── .babelrc                    # Cấu hình Babel transpiler
├── package.json
├── pnpm-lock.yaml
├── Soyte_BE_API_Collection.postman_collection.json   # Postman collection
├── README.md
└── STRUCTURE.md                # File này
```

---

## 📂 Chi Tiết Từng Module

### `src/app.js` — Khởi tạo ứng dụng Express

- Đăng ký tất cả **middleware** toàn cục (CORS, JSON parse, static files)
- Mount toàn bộ **routes** vào prefix `/api/...`
- Gọi `initCronJobs()` để kích hoạt các tác vụ tự động khi server khởi động
- Export `app` cho `server.js` sử dụng

### `src/server.js` — Khởi động Server

- Load biến môi trường qua `dotenv`
- Kết nối cơ sở dữ liệu SQL Server qua Sequelize (`authenticate()`)
- Tạo HTTPS server với chứng chỉ `key.pem` / `cert.pem`
- Lắng nghe trên port từ `process.env.PORT` (default: 3000)

---

### `src/config/`

| File | Mô Tả |
|------|-------|
| `database.js` | Khởi tạo kết nối Sequelize tới SQL Server, cấu hình timezone `+07:00` |

---

### `src/models/` — Sequelize Data Models

| File | Bảng DB | Mô Tả |
|------|---------|-------|
| `index.js` | — | Load & khởi tạo tất cả models, định nghĩa các **associations** |
| `User.js` | `Users` | Thông tin người dùng, mật khẩu hash, vai trò, đơn vị |
| `SocialFacility.js` | `SocialFacilities` | Cơ sở xã hội (đơn vị), loại cơ sở |
| `AffiliatedFacility.js` | `AffiliatedFacilities` | Cơ sở liên kết trực thuộc |
| `Post.js` | `Posts` | Bài đăng / tin tức |
| `WorkSchedule.js` | `WorkSchedules` | Lịch công tác |
| `ScheduleAttachment.js` | `ScheduleAttachments` | Tệp đính kèm của lịch công tác |
| `Form.js` | `Forms` | Biểu mẫu phản hồi |
| `Feedback.js` | `Feedbacks` | Phiếu góp ý / phản hồi |
| `FeedbackSection.js` | `FeedbackSections` | Phần (section) trong phiếu phản hồi |
| `FeedbackOption.js` | `FeedbackOptions` | Lựa chọn trong từng section |
| `Survey.js` | `Surveys` | Khảo sát |
| `Permission.js` | `Permissions` | Phân quyền theo đơn vị cho từng user |
| `EmailConfirm.js` | `EmailConfirms` | OTP xác thực email |

#### Associations chính (định nghĩa trong `index.js`)

```
User          ──hasMany──►  Post               (author_id)
User          ──hasMany──►  WorkSchedule       (created_by / approved_by)
User         ◄──belongsTo── SocialFacility     (unit)
WorkSchedule ◄──hasMany──►  User               (N-N qua schedule_attendees)
WorkSchedule  ──hasMany──►  ScheduleAttachment (CASCADE delete)
User          ──hasMany──►  Feedback           (user_id)
```

---

### `src/controllers/` — Request Handlers

Mỗi controller nhận `req`, `res`, gọi service tương ứng và trả về kết quả.

| File | Route Prefix | Chức Năng |
|------|-------------|-----------|
| `auth.controller.js` | `/api/auth` | Đăng nhập, đăng ký, verify token, đổi mật khẩu |
| `user.controller.js` | `/api/users` | CRUD người dùng, phân quyền |
| `socialFacility.controller.js` | `/api/social-facilities` | CRUD cơ sở xã hội |
| `affiliatedFacility.controller.js` | `/api/affiliated-facilities` | CRUD cơ sở liên kết |
| `post.controller.js` | `/api/posts` | CRUD bài đăng, upload ảnh |
| `schedule.controller.js` | `/api/schedules` | CRUD lịch công tác, phê duyệt, xuất PDF |
| `crawler.controller.js` | `/api/crawled-schedules` | Kích hoạt crawler thu thập dữ liệu |
| `form.controller.js` | `/api/forms` | CRUD biểu mẫu |
| `feedback.controller.js` | `/api/feedbacks` | CRUD phản hồi, thống kê |
| `survey.controller.js` | `/api/surveys` | CRUD khảo sát, xuất Excel |
| `permission.controller.js` | `/api/permissions` | Gán / thu hồi quyền đơn vị |
| `emailConfirm.controller.js` | `/api/email-confirm` | Gửi OTP và xác thực |
| `upload.controller.js` | `/api/upload` | Upload file/ảnh |

---

### `src/services/` — Business Logic

Tách biệt logic nghiệp vụ khỏi controller, trực tiếp tương tác với DB.

| File | Chức Năng |
|------|-----------|
| `auth.service.js` | Tạo/verify JWT, so sánh mật khẩu, xác thực người dùng |
| `user.service.js` | Truy vấn, tạo, cập nhật, xoá user — có hash mật khẩu |
| `post.service.js` | CRUD bài đăng + xử lý ảnh |
| `schedule.service.js` | CRUD lịch công tác, lọc theo đơn vị/người dùng, xuất PDF |
| `crawler.service.js` | Sử dụng Axios + Cheerio để scrape dữ liệu từ web ngoài |
| `form.service.js` | CRUD biểu mẫu |
| `feedback.service.js` | CRUD phản hồi, lọc theo đơn vị/loại, thống kê báo cáo |
| `survey.service.js` | CRUD khảo sát, xuất Excel |
| `permission.service.js` | Gán/thu hồi/kiểm tra quyền đơn vị |
| `email.service.js` | Gửi email OTP qua Nodemailer |

---

### `src/routes/` — API Routing

Mỗi file route map HTTP method + path tới controller function tương ứng, kèm middleware bảo vệ.

| File | Mount Point |
|------|------------|
| `auth.route.js` | `/api/auth` |
| `user.route.js` | `/api/users` |
| `socialFacility.route.js` | `/api/social-facilities` |
| `affiliatedFacility.route.js` | `/api/affiliated-facilities` |
| `post.route.js` | `/api/posts` |
| `schedule.route.js` | `/api/` (schedules, plans...) |
| `crawler.route.js` | `/api/crawled-schedules` |
| `form.route.js` | `/api/forms` |
| `feedback.route.js` | `/api/feedbacks` |
| `survey.route.js` | `/api/surveys` |
| `permission.route.js` | `/api/permissions` |
| `emailConfirm.route.js` | `/api/email-confirm` |
| `upload.route.js` | `/api/upload` |

---

### `src/middlewares/` — Middleware

| File | Chức Năng |
|------|-----------|
| `auth.middleware.js` | Xác thực JWT — kiểm tra header `Authorization: Bearer <token>` |
| `authorize.middleware.js` | Phân quyền theo **vai trò** (`superadmin`, `admin`, `user`) |
| `checkPermission.middleware.js` | Phân quyền theo **đơn vị** — kiểm tra user có quyền trên unit_id đó không |
| `upload.middleware.js` | Cấu hình Multer cho upload file thông thường |
| `postUpload.middleware.js` | Cấu hình Multer cho upload ảnh bài đăng (lọc định dạng, giới hạn kích thước) |
| `error.middleware.js` | Global error handler — bắt mọi lỗi, trả về JSON chuẩn hóa |

#### Luồng bảo vệ API điển hình

```
Request → auth.middleware (verify JWT) → authorize.middleware (check role)
        → checkPermission.middleware (check unit) → Controller
```

---

### `src/utils/` — Hàm Tiện Ích

| File | Chức Năng |
|------|-----------|
| `apiResponse.js` | Chuẩn hóa format JSON response: `{ success, message, data, ... }` |
| `ApiError.js` | Lớp custom error kế thừa `Error`, dùng với HTTP status codes |
| `validators.js` | Các rule validate input dùng `express-validator` |
| `permissionUtils.js` | Logic kiểm tra quyền đơn vị, lấy danh sách units được phép |
| `dateUtils.js` | Format/parse ngày tháng theo múi giờ `+07:00` |
| `imageProcessor.js` | Tối ưu / resize ảnh trước khi lưu |
| `seed-feedback-permissions.js` | Script seed dữ liệu quyền phản hồi ban đầu |

---

### `src/cron/` — Định Kỳ Tự Động

| File | Chức Năng |
|------|-----------|
| `scheduler.js` | Đăng ký và khởi động các cron job khi server start (dùng `node-cron`) |

---

### `uploads/` — File Storage

Thư mục lưu tất cả file do người dùng upload (ảnh bài đăng, tệp đính kèm lịch,...).
Được serve tĩnh qua endpoint `/uploads/<filename>`.

> ⚠️ Thư mục này **không được commit** vào git.

---

## 🔄 Luồng Dữ Liệu Request

```
Client (HTTPS)
    │
    ▼
src/server.js          ← Khởi động, kết nối DB
    │
    ▼
src/app.js             ← CORS, JSON parse, static files, mount routes
    │
    ▼
src/routes/*.route.js  ← Định tuyến theo method & path
    │
    ▼
src/middlewares/       ← auth → authorize → checkPermission
    │
    ▼
src/controllers/       ← Parse request, gọi service
    │
    ▼
src/services/          ← Business logic, truy vấn Sequelize
    │
    ▼
src/models/            ← Sequelize ORM → SQL Server
    │
    ▼
src/utils/apiResponse  ← Format JSON response
    │
    ▼
Client
```

---

## 🗃️ Quy Tắc Đặt Tên

| Loại file | Quy tắc | Ví dụ |
|-----------|---------|-------|
| Model | PascalCase | `WorkSchedule.js` |
| Controller | camelCase + `.controller.js` | `schedule.controller.js` |
| Service | camelCase + `.service.js` | `schedule.service.js` |
| Route | camelCase + `.route.js` | `schedule.route.js` |
| Middleware | camelCase + `.middleware.js` | `auth.middleware.js` |
| Utility | camelCase | `apiResponse.js` |
