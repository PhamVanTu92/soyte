#!/usr/bin/env node
/**
 * docker/migrate-mssql-to-pg.js
 *
 * Di chuyển toàn bộ dữ liệu từ MSSQL (nguồn) → PostgreSQL (đích).
 * Chạy một lần trên máy dev hoặc server, sau đó backend chạy với PG.
 *
 * Dùng:
 *   node docker/migrate-mssql-to-pg.js
 *
 * Các biến môi trường:
 *   .env hiện tại  → cấu hình PostgreSQL đích (DB_HOST, DB_PORT, ...)
 *   MSSQL_HOST, MSSQL_PORT, MSSQL_DB, MSSQL_USER, MSSQL_PASS → MSSQL nguồn
 *   (mặc định lấy từ server cũ 160.30.252.5)
 */
'use strict';
require('dotenv').config();

const { Sequelize, DataTypes, QueryTypes } = require('sequelize');
const path = require('path');

// ─────────────────────────────────────────────────────────────────
// Cấu hình nguồn — MSSQL
// ─────────────────────────────────────────────────────────────────
const SRC = {
  host:     process.env.MSSQL_HOST || '192.168.100.5',
  port:     parseInt(process.env.MSSQL_PORT || '1433'),
  database: process.env.MSSQL_DB   || 'SUCKHUOETHUDO_DB',
  username: process.env.MSSQL_USER || 'api_user',
  password: process.env.MSSQL_PASS || 'Api@123456',
};

// ─────────────────────────────────────────────────────────────────
// Cấu hình đích — PostgreSQL (đọc từ .env)
// ─────────────────────────────────────────────────────────────────
const DST = {
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:      process.env.DB_SSL === 'true',
};

// ─────────────────────────────────────────────────────────────────
// Tạo kết nối
// ─────────────────────────────────────────────────────────────────
const mssql = new Sequelize(SRC.database, SRC.username, SRC.password, {
  host: SRC.host, port: SRC.port,
  dialect: 'mssql',
  logging: false,
  dialectOptions: {
    options: {
      connectTimeout: 30000,
      requestTimeout: 120000,
      trustServerCertificate: true,
    },
  },
});

const pg = new Sequelize(DST.database, DST.username, DST.password, {
  host: DST.host, port: DST.port,
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: DST.ssl ? { require: true, rejectUnauthorized: false } : false,
  },
});

// ─────────────────────────────────────────────────────────────────
// Load tất cả models vào Sequelize instance bất kỳ
// ─────────────────────────────────────────────────────────────────
function loadModels(seq) {
  const db = {};
  const names = [
    'User', 'Post', 'WorkSchedule', 'ScheduleAttachment',
    'Form', 'Feedback', 'FeedbackSection', 'FeedbackOption',
    'SocialFacility', 'Permission', 'EmailConfirm', 'Survey', 'AffiliatedFacility',
  ];
  for (const name of names) {
    const def = require(path.join(__dirname, '../src/models', name));
    const model = typeof def === 'function' ? def(seq, DataTypes) : def;
    db[model.name] = model;
  }
  Object.keys(db).forEach(n => db[n].associate && db[n].associate(db));
  db.sequelize = seq;
  return db;
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
const BATCH = 500;

/** Đọc toàn bộ rows từ MSSQL, phân trang tránh timeout */
async function fetchAllMSSQL(table, orderCol = 'id') {
  const [[{ cnt }]] = await mssql.query(
    `SELECT COUNT(*) AS cnt FROM [${table}]`,
  );
  const total = Number(cnt);
  if (total === 0) return [];

  const rows = [];
  for (let off = 0; off < total; off += BATCH) {
    const batch = await mssql.query(
      `SELECT * FROM [${table}]
       ORDER BY [${orderCol}]
       OFFSET ${off} ROWS FETCH NEXT ${BATCH} ROWS ONLY`,
      { type: QueryTypes.SELECT },
    );
    rows.push(...batch);
    process.stdout.write(`\r    ${Math.min(off + BATCH, total)}/${total}`);
  }
  process.stdout.write('\n');
  return rows;
}

/** Bulk insert vào PG qua Sequelize model */
async function bulkInsert(Model, rows) {
  if (!rows.length) return;
  for (let i = 0; i < rows.length; i += BATCH) {
    await Model.bulkCreate(rows.slice(i, i + BATCH), {
      ignoreDuplicates: true,
      validate: false,
      hooks: false,
    });
  }
}

/** Insert junction table bằng raw SQL */
async function insertJunction(table, rows, cols) {
  if (!rows.length) return;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const vals = slice
      .map(r => `(${cols.map(c => {
        const v = r[c];
        return v === null ? 'NULL' : `${Number(v)}`;
      }).join(',')})`)
      .join(',');
    await pg.query(
      `INSERT INTO "${table}" (${cols.map(c => `"${c}"`).join(',')})
       VALUES ${vals} ON CONFLICT DO NOTHING`,
    );
  }
}

/** Reset SERIAL sequences về MAX(id) hiện tại */
async function resetSequences(tables) {
  for (const { tbl, col = 'id' } of tables) {
    try {
      await pg.query(`
        SELECT setval(
          pg_get_serial_sequence('"${tbl}"', '${col}'),
          COALESCE((SELECT MAX("${col}") FROM "${tbl}"), 1)
        )
      `);
      process.stdout.write(`  ↺ ${tbl}.${col}\n`);
    } catch (_) { /* Bảng không có sequence (VARCHAR PK, ...) */ }
  }
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('━'.repeat(60));
  console.log('  MSSQL → PostgreSQL Migration');
  console.log('━'.repeat(60));

  // 1. Kiểm tra kết nối
  console.log('\n📡 Kiểm tra kết nối...');
  await mssql.authenticate();
  console.log(`  ✅ MSSQL   : ${SRC.host}:${SRC.port}/${SRC.database}`);
  await pg.authenticate();
  console.log(`  ✅ PostgreSQL: ${DST.host}:${DST.port}/${DST.database}`);

  // 2. Tạo schema PostgreSQL
  console.log('\n🏗️  Tạo schema PostgreSQL (sync force)...');
  const pgDb = loadModels(pg);
  await pg.sync({ force: true });
  console.log('  ✅ Tất cả bảng đã được tạo.\n');

  // 3. Tắt kiểm tra FK trong session
  await pg.query("SET session_replication_role = replica");

  // 4. Migrate từng bảng theo thứ tự FK
  const tables = [
    // ── Không phụ thuộc FK ──────────────────────────────────────
    { src: 'social_facilities',   model: pgDb.SocialFacility,     orderBy: 'id' },
    { src: 'affiliated_facilities', model: pgDb.AffiliatedFacility, orderBy: 'id' },
    { src: 'forms',               model: pgDb.Form,               orderBy: 'id' },
    { src: 'surveys',             model: pgDb.Survey,             orderBy: 'id' },
    // ── Self-ref (parent_id) ────────────────────────────────────
    { src: 'permissions',         model: pgDb.Permission,         orderBy: 'id' },
    // ── FK → social_facilities ──────────────────────────────────
    { src: 'users',               model: pgDb.User,               orderBy: 'id' },
    // ── FK → users / forms ──────────────────────────────────────
    { src: 'email_confirm',       model: pgDb.EmailConfirm,       orderBy: 'id' },
    { src: 'posts',               model: pgDb.Post,               orderBy: 'id' },
    { src: 'work_schedules',      model: pgDb.WorkSchedule,       orderBy: 'id' },
    { src: 'feedbacks',           model: pgDb.Feedback,           orderBy: 'id' },
    // ── FK → feedbacks ──────────────────────────────────────────
    { src: 'feedback_sections',   model: pgDb.FeedbackSection,    orderBy: 'id' },
    // ── FK → feedback_sections ──────────────────────────────────
    { src: 'feedback_options',    model: pgDb.FeedbackOption,     orderBy: 'id' },
    // ── FK → work_schedules ─────────────────────────────────────
    { src: 'schedule_attachments', model: pgDb.ScheduleAttachment, orderBy: 'id' },
  ];

  for (const t of tables) {
    process.stdout.write(`  ➜ ${t.src} ... `);
    const rows = await fetchAllMSSQL(t.src, t.orderBy);
    if (rows.length === 0) {
      console.log('  (trống)');
      continue;
    }
    await bulkInsert(t.model, rows);
    console.log(`  ✅ ${rows.length} rows`);
  }

  // 5. Junction tables (không có Sequelize model riêng)
  console.log('\n  ➜ user_permissions (junction)');
  const upRows = await mssql.query(
    'SELECT [user_id], [permission_id] FROM [user_permissions]',
    { type: QueryTypes.SELECT },
  );
  await insertJunction('user_permissions', upRows, ['user_id', 'permission_id']);
  console.log(`  ✅ ${upRows.length} rows`);

  console.log('  ➜ schedule_attendees (junction)');
  const saRows = await mssql.query(
    'SELECT [schedule_id], [user_id] FROM [schedule_attendees]',
    { type: QueryTypes.SELECT },
  );
  await insertJunction('schedule_attendees', saRows, ['schedule_id', 'user_id']);
  console.log(`  ✅ ${saRows.length} rows`);

  // 6. Bật lại FK checks
  await pg.query("SET session_replication_role = DEFAULT");

  // 7. Reset sequences về max(id)
  console.log('\n🔁 Reset SERIAL sequences...');
  await resetSequences([
    { tbl: 'users' },
    { tbl: 'permissions' },
    { tbl: 'forms' },
    { tbl: 'surveys' },
    { tbl: 'email_confirm' },
    { tbl: 'feedbacks' },
    { tbl: 'feedback_sections' },
    { tbl: 'feedback_options' },
    { tbl: 'posts' },
    { tbl: 'work_schedules' },
    { tbl: 'schedule_attachments' },
    { tbl: 'affiliated_facilities' },
  ]);

  await mssql.close();
  await pg.close();

  console.log('\n' + '━'.repeat(60));
  console.log('  ✅ Migration hoàn tất!');
  console.log('━'.repeat(60));
  console.log('\nBước tiếp theo:');
  console.log('  1. Kiểm tra dữ liệu trên PostgreSQL');
  console.log('  2. Đổi .env: DB_DIALECT=postgres, DB_HOST=127.0.0.1 (trên server)');
  console.log('  3. Khởi động backend: node src/server.js hoặc docker-compose up\n');
}

main().catch(err => {
  console.error('\n❌ Lỗi:', err.message);
  if (err.original) console.error('   Chi tiết:', err.original.message);
  process.exit(1);
});
