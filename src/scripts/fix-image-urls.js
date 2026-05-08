'use strict';

/**
 * fix-image-urls.js
 * Thay thế URL server cũ → URL server mới trong tất cả cột chứa đường dẫn ảnh/file.
 *
 * Chạy:
 *   node src/scripts/fix-image-urls.js
 *
 * Yêu cầu .env:
 *   OLD_BASE_URLS=http://160.30.252.5:3000,http://192.168.100.5:3000
 *   APP_BASE_URL=https://suckhoethudo.vn      (hoặc FRONTEND_URL)
 *
 * Dry-run (chỉ in ra, không UPDATE):
 *   DRY_RUN=1 node src/scripts/fix-image-urls.js
 */

require('dotenv').config();
const db = require('../config/database');
const { getAppBaseUrl, parseOldBases } = require('../utils/urlHelper');

const DRY_RUN = process.env.DRY_RUN === '1';

// ── Danh sách bảng & cột cần sửa ─────────────────────────────────────────
// format: { table, columns: string[], isHtml?: boolean }
// isHtml=true → dùng REPLACE nhiều lần trên nội dung HTML (posts.content)
const TARGETS = [
  { table: 'posts',                  columns: ['image_url'] },
  { table: 'posts',                  columns: ['content'], isHtml: true },
  { table: 'affiliated_facilities',  columns: ['logo'] },
  { table: 'schedule_attachments',   columns: ['file_path'] },
  // Thêm vào đây nếu có bảng khác
];

const isPG = () => (db.options.dialect || '') === 'postgres';

async function replaceColumn(table, column, oldBase, newBase) {
  const count = await countMatches(table, column, oldBase);
  if (count === 0) return 0;

  console.log(`   → "${table}"."${column}": ${count} rows chứa "${oldBase}"`);

  if (DRY_RUN) {
    console.log(`      [DRY_RUN] Sẽ UPDATE ${count} rows`);
    return count;
  }

  if (isPG()) {
    await db.query(
      `UPDATE "${table}" SET "${column}" = REPLACE("${column}", :old, :new)
       WHERE "${column}" LIKE :pattern`,
      { replacements: { old: oldBase, new: newBase, pattern: `%${oldBase}%` } }
    );
  } else {
    await db.query(
      `UPDATE [${table}] SET [${column}] = REPLACE([${column}], :old, :new)
       WHERE [${column}] LIKE :pattern`,
      { replacements: { old: oldBase, new: newBase, pattern: `%${oldBase}%` } }
    );
  }

  return count;
}

async function countMatches(table, column, oldBase) {
  const q = isPG()
    ? `SELECT COUNT(*) AS cnt FROM "${table}" WHERE "${column}" LIKE :pattern`
    : `SELECT COUNT(*) AS cnt FROM [${table}] WHERE [${column}] LIKE :pattern`;

  const rows = await db.query(q, {
    replacements: { pattern: `%${oldBase}%` },
    type: db.QueryTypes.SELECT,
  });
  return parseInt(rows[0]?.cnt ?? rows[0]?.CNT ?? 0, 10);
}

async function main() {
  const oldBases = parseOldBases();
  const newBase  = getAppBaseUrl();

  if (oldBases.length === 0) {
    console.error('❌ Thiếu OLD_BASE_URLS trong .env');
    console.error('   VD: OLD_BASE_URLS=http://160.30.252.5:3000,http://192.168.100.5:3000');
    process.exit(1);
  }

  console.log('\n══════════════════════════════════════════════════');
  console.log('  FIX IMAGE URLs trong DB');
  console.log(`  Old bases : ${oldBases.join(' | ')}`);
  console.log(`  New base  : ${newBase}`);
  console.log(`  Mode      : ${DRY_RUN ? 'DRY RUN (không UPDATE)' : 'LIVE UPDATE'}`);
  console.log('══════════════════════════════════════════════════\n');

  await db.authenticate();
  console.log('✅ Kết nối DB OK\n');

  let totalFixed = 0;

  for (const target of TARGETS) {
    for (const column of target.columns) {
      console.log(`📋 Bảng: ${target.table} | Cột: ${column}`);
      for (const oldBase of oldBases) {
        const fixed = await replaceColumn(target.table, column, oldBase, newBase);
        totalFixed += fixed;
      }
    }
  }

  console.log('\n══════════════════════════════════════════════════');
  console.log(`  ✅ Hoàn tất! Tổng rows đã xử lý: ${totalFixed}`);
  if (DRY_RUN) console.log('  ⚠️  Dry-run — không có gì bị thay đổi thật sự.');
  console.log('══════════════════════════════════════════════════\n');

  await db.close();
}

main().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
