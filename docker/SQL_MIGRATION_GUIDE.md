# Hướng dẫn chuyển Raw SQL từ MSSQL → PostgreSQL

Khi đổi `DB_DIALECT=postgres`, các raw SQL query trong code cần được cập nhật.
Dưới đây là bảng tra cứu nhanh và danh sách file cần sửa.

---

## Bảng tra cứu cú pháp

| Chức năng           | MSSQL                              | PostgreSQL                          |
|---------------------|------------------------------------|-------------------------------------|
| Tên bảng/cột        | `[feedback_sections]`              | `"feedback_sections"` hoặc không cần quote |
| Chuỗi Unicode       | `N'tiếng Việt'`                    | `'tiếng Việt'` (PG mặc định UTF-8) |
| Thời gian hiện tại  | `GETDATE()`                        | `NOW()`                             |
| Lấy n dòng đầu      | `SELECT TOP(100) ...`              | `SELECT ... LIMIT 100`              |
| Auto increment      | `INT IDENTITY(1,1)`                | `SERIAL` hoặc `BIGSERIAL`           |
| Ép kiểu ngày        | `CAST(x AS DATE)`                  | `x::DATE` hoặc `CAST(x AS DATE)`   |
| Điều kiện tồn tại   | `IF NOT EXISTS (...) BEGIN ... END`| `DO $$ BEGIN IF NOT EXISTS ... END IF; END $$` |
| Check bảng tồn tại  | `INFORMATION_SCHEMA.TABLES`        | `information_schema.tables` (lowercase) |
| Kiểu chuỗi dài      | `NVARCHAR(MAX)`                    | `TEXT`                              |
| Kiểu chuỗi          | `NVARCHAR(255)`                    | `VARCHAR(255)`                      |
| JSON column         | `NVARCHAR(MAX)` + manual parse     | `JSONB` (native, có thể index)      |
| Boolean             | `BIT` (0/1)                        | `BOOLEAN` (true/false)              |
| Regex               | không có                           | `~` operator                        |
| String nối          | `+`                                | `\|\|`                              |

---

## File cần sửa raw SQL

### 1. `src/migrations/runner.js`
```js
// MSSQL
`IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '_migrations')
 BEGIN CREATE TABLE [_migrations] (...) END`

// PostgreSQL
`CREATE TABLE IF NOT EXISTS "_migrations" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ DEFAULT NOW()
)`
```

### 2. `src/migrations/20250101000000_add_password_changed_at.js`
```js
// MSSQL
`ALTER TABLE [users] ADD [password_changed_at] DATETIME2 NULL`

// PostgreSQL
`ALTER TABLE "users" ADD COLUMN "password_changed_at" TIMESTAMPTZ NULL`
```

### 3. `src/services/feedback.service.js` — raw SELECT queries
```js
// MSSQL — bracket quotes, N'string', GETDATE()
sequelize.query(`SELECT TOP(10) f.[id] FROM [feedbacks] f WHERE f.[created_at] >= GETDATE()`)

// PostgreSQL — double quotes (optional), no N prefix, NOW()
sequelize.query(`SELECT f."id" FROM "feedbacks" f WHERE f."created_at" >= NOW() LIMIT 10`)
```

### 4. `src/services/report.service.js` — batch JOIN queries
```js
// MSSQL
`SELECT fs.[feedback_id], fo.[data]
 FROM [feedback_sections] fs
 LEFT JOIN [feedback_options] fo ON fo.[feedback_section_id] = fs.[id]
 WHERE fs.[feedback_id] IN (:ids)`

// PostgreSQL — dùng ANY(:ids) thay vì IN(:ids) với array
`SELECT fs.feedback_id, fo.data
 FROM feedback_sections fs
 LEFT JOIN feedback_options fo ON fo.feedback_section_id = fs.id
 WHERE fs.feedback_id = ANY(ARRAY[:ids])`
// Hoặc IN (:ids) vẫn hoạt động với replacements dạng array
```

---

## Cách chạy migration tương thích cả hai

Tách migration theo dialect hoặc dùng Sequelize QueryInterface
thay vì raw SQL để tránh viết 2 lần:

```js
// Thay vì:
await sequelize.query(`ALTER TABLE [users] ADD [col] NVARCHAR(255)`)

// Dùng:
const qi = sequelize.getQueryInterface();
await qi.addColumn('users', 'col', { type: DataTypes.STRING(255), allowNull: true });
// → Sequelize tự sinh SQL đúng cho từng dialect
```

---

## Kiểm tra nhanh

Sau khi đổi sang PostgreSQL, chạy:
```bash
docker-compose -f docker-compose.postgres.yml up -d
docker-compose -f docker-compose.postgres.yml logs -f backend
```

Nếu migration pass và server start → SQL đã tương thích.
