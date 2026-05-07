'use strict';

/**
 * seed-users.js
 * Migrate users còn thiếu từ MSSQL cũ → DB mới (PostgreSQL / MSSQL).
 * Idempotent: skip nếu email đã tồn tại.
 *
 * Chạy:
 *   node src/scripts/seed-users.js
 *
 * Yêu cầu .env có OLD_DB_* và DB_* (DB mới):
 *   OLD_DB_HOST=160.30.252.5
 *   OLD_DB_USER=api_user
 *   OLD_DB_PASSWORD=Api@123456
 *   OLD_DB_NAME=SUCKHUOETHUDO_DB
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

// ── Kết nối DB cũ (MSSQL) ─────────────────────────────────────────
const oldDb = new Sequelize(
  process.env.OLD_DB_NAME     || 'SUCKHUOETHUDO_DB',
  process.env.OLD_DB_USER     || 'api_user',
  process.env.OLD_DB_PASSWORD || 'Api@123456',
  {
    host:    process.env.OLD_DB_HOST || '160.30.252.5',
    port:    parseInt(process.env.OLD_DB_PORT || '1433'),
    dialect: 'mssql',
    logging: false,
    dialectOptions: {
      options: { trustServerCertificate: true, connectTimeout: 30000 },
    },
  }
);

// ── Kết nối DB mới (từ .env) ──────────────────────────────────────
const newDb = require('../config/database');
const isPG  = () => (newDb.options.dialect || '') === 'postgres';

async function main() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('  SEED USERS từ DB cũ → DB mới');
  console.log(`  Old: ${process.env.OLD_DB_HOST || '160.30.252.5'} (MSSQL)`);
  console.log(`  New: ${newDb.options.host} (${newDb.options.dialect})`);
  console.log('══════════════════════════════════════════════════\n');

  await oldDb.authenticate();
  console.log('✅ Kết nối DB cũ OK');
  await newDb.authenticate();
  console.log('✅ Kết nối DB mới OK\n');

  // ── Lấy toàn bộ users từ DB cũ ───────────────────────────────
  const oldUsers = await oldDb.query(
    `SELECT u.*, sf.[type] AS facility_type
     FROM [users] u
     LEFT JOIN [social_facilities] sf ON sf.id = u.unit`,
    { type: Sequelize.QueryTypes.SELECT }
  ).catch(() =>
    oldDb.query('SELECT * FROM [users]', { type: Sequelize.QueryTypes.SELECT })
  );

  console.log(`📋 DB cũ có ${oldUsers.length} users\n`);

  // ── Lấy emails đã có trong DB mới ────────────────────────────
  const existingRows = await newDb.query(
    isPG()
      ? `SELECT email FROM "users"`
      : `SELECT email FROM [users]`,
    { type: Sequelize.QueryTypes.SELECT }
  );
  const existingEmails = new Set(existingRows.map(r => r.email));
  console.log(`📋 DB mới đã có ${existingEmails.size} users\n`);

  // ── Migrate từng user còn thiếu ──────────────────────────────
  let inserted = 0, skipped = 0, errors = 0;

  for (const r of oldUsers) {
    if (!r.email) { skipped++; continue; }

    if (existingEmails.has(r.email)) {
      skipped++;
      continue;
    }

    try {
      if (isPG()) {
        await newDb.query(
          `INSERT INTO "users"
             (email, password, username, full_name, role, status,
              unit, is_verified, type, created_at, updated_at)
           VALUES
             (:email, :password, :username, :full_name, :role, :status,
              :unit, :is_verified, :type, :created_at, :updated_at)
           ON CONFLICT (email) DO NOTHING`,
          {
            replacements: {
              email:        r.email,
              password:     r.password,
              username:     r.username    || null,
              full_name:    r.full_name   || null,
              role:         r.role        || 'user',
              status:       r.status      ?? -1,
              unit:         r.unit        || null,
              is_verified:  r.is_verified ?? false,
              type:         r.type        || null,
              created_at:   r.created_at  || new Date(),
              updated_at:   r.updated_at  || new Date(),
            },
          }
        );
      } else {
        await newDb.query(
          `IF NOT EXISTS (SELECT 1 FROM [users] WHERE email = :email)
           INSERT INTO [users]
             ([email],[password],[username],[full_name],[role],[status],
              [unit],[is_verified],[type],[created_at],[updated_at])
           VALUES
             (:email,:password,:username,:full_name,:role,:status,
              :unit,:is_verified,:type,:created_at,:updated_at)`,
          {
            replacements: {
              email:        r.email,
              password:     r.password,
              username:     r.username    || null,
              full_name:    r.full_name   || null,
              role:         r.role        || 'user',
              status:       r.status      ?? -1,
              unit:         r.unit        || null,
              is_verified:  r.is_verified ?? 0,
              type:         r.type        || null,
              created_at:   r.created_at  || new Date(),
              updated_at:   r.updated_at  || new Date(),
            },
          }
        );
      }

      existingEmails.add(r.email); // cập nhật set để tránh duplicate trong cùng batch
      inserted++;
      process.stdout.write(`\r  ✅ Inserted: ${inserted} | Skipped: ${skipped} | Errors: ${errors}`);
    } catch (e) {
      errors++;
      console.error(`\n  ❌ Lỗi user ${r.email}: ${e.message}`);
    }
  }

  console.log('\n');
  console.log('══════════════════════════════════════════════════');
  console.log(`  ✅ Hoàn tất!`);
  console.log(`     Inserted : ${inserted}`);
  console.log(`     Skipped  : ${skipped} (đã tồn tại)`);
  console.log(`     Errors   : ${errors}`);
  console.log('══════════════════════════════════════════════════\n');

  await oldDb.close();
  await newDb.close();
}

main().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
