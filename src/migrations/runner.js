/**
 * Migration Runner — tương thích MSSQL & PostgreSQL
 *
 * Dùng:
 *   node src/migrations/runner.js up           — chạy tất cả migration chưa áp dụng
 *   node src/migrations/runner.js down         — rollback migration cuối cùng
 *   node src/migrations/runner.js down all     — rollback tất cả
 *   node src/migrations/runner.js status       — xem trạng thái các migration
 *   node src/migrations/runner.js create <tên> — tạo file migration mới
 */

require('dotenv').config();
const path = require('path');
const fs   = require('fs');
const sequelize = require('../config/database');

const MIGRATIONS_DIR   = __dirname;
const MIGRATIONS_TABLE = '_migrations';

// ── Dialect helpers ───────────────────────────────────────────────
const isPG = () => (sequelize.options.dialect || '') === 'postgres';

/** Wrap identifier — dùng "quotes" cho PG, [brackets] cho MSSQL */
const qi = (name) => isPG() ? `"${name}"` : `[${name}]`;

/** Thời gian hiện tại */
const now = () => isPG() ? 'NOW()' : 'GETDATE()';

// ── Khởi tạo bảng tracking ────────────────────────────────────────
async function ensureMigrationsTable() {
  if (isPG()) {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${MIGRATIONS_TABLE}" (
        "id"         SERIAL PRIMARY KEY,
        "name"       VARCHAR(255) NOT NULL UNIQUE,
        "applied_at" TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } else {
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_NAME = '${MIGRATIONS_TABLE}'
      )
      BEGIN
        CREATE TABLE [${MIGRATIONS_TABLE}] (
          [id]         INT IDENTITY(1,1) PRIMARY KEY,
          [name]       NVARCHAR(255) NOT NULL UNIQUE,
          [applied_at] DATETIME2 DEFAULT GETDATE()
        )
      END
    `);
  }
}

// ── Lấy danh sách migration đã chạy ──────────────────────────────
async function getApplied() {
  const [rows] = await sequelize.query(
    `SELECT ${qi('name')} FROM ${qi(MIGRATIONS_TABLE)} ORDER BY ${qi('id')} ASC`
  );
  return rows.map(r => r.name);
}

// ── Lấy tất cả file migration (tên: YYYYMMDDHHMMSS_xxx.js) ────────
function getMigrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => /^\d{14}_.+\.js$/.test(f))
    .sort();
}

// ── Chạy UP ───────────────────────────────────────────────────────
async function runUp() {
  await ensureMigrationsTable();
  const applied = await getApplied();
  const files   = getMigrationFiles();
  const pending = files.filter(f => !applied.includes(f));

  if (pending.length === 0) {
    console.log('✅ Không có migration nào cần chạy.');
    return;
  }

  console.log(`▶  ${pending.length} migration sẽ được áp dụng:\n`);

  for (const file of pending) {
    const migration = require(path.join(MIGRATIONS_DIR, file));
    process.stdout.write(`  ⏳ ${file} ... `);
    const t = await sequelize.transaction();
    try {
      await migration.up(sequelize, t);
      await sequelize.query(
        `INSERT INTO ${qi(MIGRATIONS_TABLE)} (${qi('name')}) VALUES (:name)`,
        { replacements: { name: file }, transaction: t }
      );
      await t.commit();
      console.log('✅ OK');
    } catch (err) {
      // Rollback — bắt lỗi phụ "no corresponding BEGIN TRANSACTION" của MSSQL:
      // XACT_ABORT đã tự rollback transaction khi statement lỗi → Sequelize rollback
      // thủ công sẽ fail với lỗi này. Đây là safe to ignore; transaction đã sạch.
      try { await t.rollback(); } catch (rbErr) {
        if (!/no corresponding BEGIN/i.test(rbErr.message)) {
          console.warn(`\n     ⚠️  Rollback warning: ${rbErr.message}`);
        }
      }
      console.log('❌ FAILED');
      console.error(`\n     Error: ${err.message}`);
      if (err.parent) console.error(`     Detail: ${err.parent.message}`);
      process.exit(1);
    }
  }

  console.log('\n✅ Hoàn tất.');
}

// ── Chạy DOWN ─────────────────────────────────────────────────────
async function runDown(all = false) {
  await ensureMigrationsTable();
  const applied = await getApplied();

  if (applied.length === 0) {
    console.log('ℹ️  Chưa có migration nào được áp dụng.');
    return;
  }

  const toRollback = all ? [...applied].reverse() : [applied[applied.length - 1]];
  console.log(`◀  ${toRollback.length} migration sẽ được rollback:\n`);

  for (const file of toRollback) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠️  File không tồn tại, bỏ qua: ${file}`);
      continue;
    }
    const migration = require(filePath);
    process.stdout.write(`  ⏳ ${file} ... `);
    const t = await sequelize.transaction();
    try {
      await migration.down(sequelize, t);
      await sequelize.query(
        `DELETE FROM ${qi(MIGRATIONS_TABLE)} WHERE ${qi('name')} = :name`,
        { replacements: { name: file }, transaction: t }
      );
      await t.commit();
      console.log('✅ Rolled back');
    } catch (err) {
      try { await t.rollback(); } catch (rbErr) {
        if (!/no corresponding BEGIN/i.test(rbErr.message)) {
          console.warn(`\n     ⚠️  Rollback warning: ${rbErr.message}`);
        }
      }
      console.log('❌ FAILED');
      console.error(`\n     Error: ${err.message}`);
      if (err.parent) console.error(`     Detail: ${err.parent.message}`);
      process.exit(1);
    }
  }

  console.log('\n✅ Hoàn tất.');
}

// ── Xem trạng thái ────────────────────────────────────────────────
async function runStatus() {
  await ensureMigrationsTable();
  const applied = new Set(await getApplied());
  const files   = getMigrationFiles();

  console.log('\n  Migration Status\n  ' + '─'.repeat(60));
  if (files.length === 0) console.log('  (Chưa có file migration nào)');
  for (const f of files) {
    const status = applied.has(f) ? '✅ applied ' : '⏳ pending ';
    console.log(`  ${status}  ${f}`);
  }
  console.log('  ' + '─'.repeat(60));
  console.log(`  Total: ${files.length} | Applied: ${applied.size} | Pending: ${files.length - applied.size}\n`);
}

// ── Tạo file migration mới ────────────────────────────────────────
function runCreate(name) {
  if (!name) {
    console.error('❌ Vui lòng cung cấp tên migration.\n   Ví dụ: node runner.js create add_phone_to_users');
    process.exit(1);
  }
  const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const slug      = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  const filename  = `${timestamp}_${slug}.js`;
  const filePath  = path.join(MIGRATIONS_DIR, filename);

  const template = `'use strict';

/**
 * Migration: ${slug}
 * Created: ${new Date().toISOString()}
 */

const isPG = (seq) => (seq.options.dialect || '') === 'postgres';

module.exports = {
  async up(sequelize, transaction) {
    if (isPG(sequelize)) {
      await sequelize.query(\`
        -- TODO: PostgreSQL SQL
      \`, { transaction });
    } else {
      await sequelize.query(\`
        -- TODO: MSSQL SQL
      \`, { transaction });
    }
  },

  async down(sequelize, transaction) {
    if (isPG(sequelize)) {
      await sequelize.query(\`
        -- TODO: PostgreSQL rollback
      \`, { transaction });
    } else {
      await sequelize.query(\`
        -- TODO: MSSQL rollback
      \`, { transaction });
    }
  },
};
`;

  fs.writeFileSync(filePath, template, 'utf8');
  console.log(`✅ Tạo migration: ${filename}`);
}

// ── Entry point ───────────────────────────────────────────────────
(async () => {
  const [,, command, arg] = process.argv;

  if (command === 'create') {
    runCreate(arg);
    process.exit(0);
  }

  try {
    await sequelize.authenticate();
    console.log(`  DB dialect: ${sequelize.options.dialect} | host: ${sequelize.options.host}`);
  } catch (e) {
    console.error('❌ Không thể kết nối database:', e.message);
    process.exit(1);
  }

  try {
    if (command === 'up' || !command)    await runUp();
    else if (command === 'down')         await runDown(arg === 'all');
    else if (command === 'status')       await runStatus();
    else {
      console.error(`❌ Lệnh không hợp lệ: ${command}`);
      console.log('   Dùng: up | down [all] | status | create <tên>');
      process.exit(1);
    }
  } finally {
    await sequelize.close();
  }
})();
