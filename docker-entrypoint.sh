#!/bin/sh
set -e

DB_DIALECT="${DB_DIALECT:-mssql}"

# Chọn host/port mặc định theo dialect
if [ "$DB_DIALECT" = "postgres" ]; then
  DB_HOST="${DB_HOST:-postgres}"
  DB_PORT="${DB_PORT:-5432}"
else
  DB_HOST="${DB_HOST:-sqlserver}"
  DB_PORT="${DB_PORT:-1433}"
fi

# ── 1. Chờ database lắng nghe trên cổng ──────────────────────────
echo "⏳ Chờ $DB_DIALECT tại $DB_HOST:$DB_PORT..."
RETRIES=40
i=0
until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
  i=$((i + 1))
  if [ "$i" -ge "$RETRIES" ]; then
    echo "❌ Không thể kết nối $DB_DIALECT sau ${RETRIES} lần thử. Dừng lại."
    exit 1
  fi
  echo "  ($i/$RETRIES) Chưa sẵn sàng, thử lại sau 3s..."
  sleep 3
done
echo "✅ Port mở."

# ── 2. Khởi tạo DB + user (chỉ MSSQL — PostgreSQL tự xử lý qua env) ──
if [ "$DB_DIALECT" = "postgres" ]; then
  echo "ℹ️  PostgreSQL: DB/user đã được khởi tạo tự động bởi image, bỏ qua setup."
  sleep 3   # cho PostgreSQL hoàn tất init scripts
elif [ -n "$SA_PASSWORD" ]; then
  echo "🔧 Khởi tạo MSSQL database và user..."
  node docker/setup-db.js
else
  echo "⚠️  SA_PASSWORD không được cấu hình — bỏ qua bước khởi tạo DB."
fi

# ── 3. Chạy migration ─────────────────────────────────────────────
echo "🔄 Chạy migration..."
node src/migrations/runner.js up

# ── 4. Khởi động ứng dụng ─────────────────────────────────────────
echo "🚀 Khởi động server..."
exec "$@"
