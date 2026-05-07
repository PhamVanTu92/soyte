'use strict';

/**
 * Migration: seed_admin_role
 *
 * 1. Upsert các permission còn thiếu (trading_facility, feedback, admin, survey)
 * 2. Upsert role "Admin" trong bảng roles
 * 3. Gán TOÀN BỘ permissions vào role Admin (role_permissions)
 * 4. Gán role Admin cho user admin@soyte.gov.vn (cập nhật role_id)
 *
 * Idempotent — chạy nhiều lần không bị lỗi.
 * Tương thích: PostgreSQL & MSSQL
 */

const isPG = (seq) => (seq.options.dialect || '') === 'postgres';

// ── Permission còn thiếu (chưa có trong seed gốc) ─────────────────
// Cấu trúc: [name, description, parentName | null]
// parentName null  → permission gốc (top-level)
// parentName có giá trị → tự tra id cha theo name
const MISSING_PERMISSIONS = [
  // Module admin (bypass toàn bộ)
  ['admin',                    'Quyền truy cập toàn bộ chức năng Admin',    null],

  // Module feedback (catch-all cho feedback routes)
  ['feedback',                 'Module Phản hồi (catch-all)',                null],

  // Module survey (survey.route dùng survey.view trực tiếp)
  ['survey',                   'Module Khảo sát',                           null],
  ['survey.view',              'Xem danh sách khảo sát',                    'survey'],

  // Module roles (quản lý vai trò)
  ['roles',                    'Module Quản lý vai trò',                    null],
  ['roles.view',               'Xem danh sách vai trò',                     'roles'],
  ['roles.create',             'Tạo vai trò mới',                           'roles'],
  ['roles.update',             'Cập nhật vai trò',                          'roles'],
  ['roles.delete',             'Xóa vai trò',                               'roles'],
  ['roles.assign',             'Gán vai trò cho người dùng',                'roles'],

  // Module trading_facility (cơ sở buôn bán)
  ['trading_facility',         'Module Cơ sở buôn bán dược',                null],
  ['trading_facility.view',    'Xem danh sách cơ sở buôn bán',             'trading_facility'],
  ['trading_facility.create',  'Thêm cơ sở buôn bán',                      'trading_facility'],
  ['trading_facility.update',  'Cập nhật cơ sở buôn bán',                  'trading_facility'],
  ['trading_facility.delete',  'Xóa cơ sở buôn bán',                       'trading_facility'],
];

// ── Helper: upsert permission, trả về id ──────────────────────────
async function upsertPermission(seq, tx, name, description, parentId) {
  if (isPG(seq)) {
    const [[existing]] = await seq.query(
      `SELECT id FROM "permissions" WHERE name = :name`,
      { replacements: { name }, transaction: tx }
    );
    if (existing) return existing.id;

    const [[inserted]] = await seq.query(
      `INSERT INTO "permissions" (name, description, parent_id, created_at, updated_at)
       VALUES (:name, :desc, :parentId, NOW(), NOW())
       RETURNING id`,
      { replacements: { name, desc: description, parentId: parentId ?? null }, transaction: tx }
    );
    return inserted.id;
  } else {
    const [[existing]] = await seq.query(
      `SELECT id FROM [permissions] WHERE name = :name`,
      { replacements: { name }, transaction: tx }
    );
    if (existing) return existing.id;

    await seq.query(
      `INSERT INTO [permissions] ([name],[description],[parent_id],[created_at],[updated_at])
       VALUES (:name,:desc,:parentId,GETDATE(),GETDATE())`,
      { replacements: { name, desc: description, parentId: parentId ?? null }, transaction: tx }
    );
    const [[newRow]] = await seq.query(
      `SELECT id FROM [permissions] WHERE name = :name`,
      { replacements: { name }, transaction: tx }
    );
    return newRow.id;
  }
}

// ── Helper: upsert role, trả về id ───────────────────────────────
async function upsertRole(seq, tx, name, description) {
  if (isPG(seq)) {
    const [[existing]] = await seq.query(
      `SELECT id FROM "roles" WHERE name = :name`,
      { replacements: { name }, transaction: tx }
    );
    if (existing) return existing.id;

    const [[inserted]] = await seq.query(
      `INSERT INTO "roles" (name, description, is_active, created_at, updated_at)
       VALUES (:name, :desc, TRUE, NOW(), NOW())
       RETURNING id`,
      { replacements: { name, desc: description }, transaction: tx }
    );
    return inserted.id;
  } else {
    const [[existing]] = await seq.query(
      `SELECT id FROM [roles] WHERE name = :name`,
      { replacements: { name }, transaction: tx }
    );
    if (existing) return existing.id;

    await seq.query(
      `INSERT INTO [roles] ([name],[description],[is_active],[created_at],[updated_at])
       VALUES (:name,:desc,1,GETDATE(),GETDATE())`,
      { replacements: { name, desc: description }, transaction: tx }
    );
    const [[newRow]] = await seq.query(
      `SELECT id FROM [roles] WHERE name = :name`,
      { replacements: { name }, transaction: tx }
    );
    return newRow.id;
  }
}

module.exports = {
  async up(sequelize, transaction) {
    // ── 1. Upsert các permissions còn thiếu ──────────────────────
    console.log('      [1/4] Thêm permissions còn thiếu...');
    const nameToId = {}; // cache name → id

    for (const [name, desc, parentName] of MISSING_PERMISSIONS) {
      const parentId = parentName ? (nameToId[parentName] ?? null) : null;
      const id = await upsertPermission(sequelize, transaction, name, desc, parentId);
      nameToId[name] = id;
    }
    console.log(`      ✅ Upserted ${MISSING_PERMISSIONS.length} permissions.`);

    // ── 2. Upsert role "Admin" ────────────────────────────────────
    console.log('      [2/4] Tạo role Admin...');
    const adminRoleId = await upsertRole(
      sequelize, transaction,
      'Admin',
      'Quản trị viên hệ thống — có toàn bộ quyền'
    );
    console.log(`      ✅ Role Admin id = ${adminRoleId}`);

    // ── 3. Gán TẤT CẢ permissions vào role Admin ─────────────────
    console.log('      [3/4] Gán toàn bộ permissions vào role Admin...');
    const q = isPG(sequelize);
    const [permRows] = await sequelize.query(
      q ? `SELECT id FROM "permissions" ORDER BY id ASC`
        : `SELECT id FROM [permissions] ORDER BY id ASC`,
      { transaction }
    );

    let rpInserted = 0, rpSkipped = 0;
    for (const perm of permRows) {

      const [exists] = await sequelize.query(
        q
          ? `SELECT 1 FROM "role_permissions" WHERE role_id = :rId AND permission_id = :pId`
          : `SELECT 1 FROM [role_permissions] WHERE role_id = :rId AND permission_id = :pId`,
        { replacements: { rId: adminRoleId, pId: perm.id }, transaction }
      );
      if (exists.length > 0) { rpSkipped++; continue; }

      await sequelize.query(
        q
          ? `INSERT INTO "role_permissions" (role_id, permission_id) VALUES (:rId, :pId)`
          : `INSERT INTO [role_permissions] ([role_id],[permission_id]) VALUES (:rId,:pId)`,
        { replacements: { rId: adminRoleId, pId: perm.id }, transaction }
      );
      rpInserted++;
    }
    console.log(`      ✅ role_permissions: inserted ${rpInserted}, skipped ${rpSkipped}.`);

    // ── 4. Gán role Admin cho user admin@soyte.gov.vn ─────────────
    console.log('      [4/4] Gán role Admin cho admin@soyte.gov.vn...');
    const [userRows] = await sequelize.query(
      q
        ? `SELECT id, email FROM "users" WHERE email = 'admin@soyte.gov.vn'`
        : `SELECT id, email FROM [users] WHERE email = 'admin@soyte.gov.vn'`,
      { transaction }
    );

    if (userRows.length === 0) {
      console.warn('      ⚠️  Không tìm thấy user admin@soyte.gov.vn — bỏ qua bước 4.');
    } else {
      const adminUser = userRows[0];
      await sequelize.query(
        q
          ? `UPDATE "users" SET role_id = :rId, updated_at = NOW() WHERE id = :uId`
          : `UPDATE [users] SET role_id = :rId, updated_at = GETDATE() WHERE id = :uId`,
        { replacements: { rId: adminRoleId, uId: adminUser.id }, transaction }
      );
      console.log(`      ✅ User ${adminUser.email} (id=${adminUser.id}) → role_id = ${adminRoleId}`);
    }
  },

  async down(sequelize, transaction) {
    const q = isPG(sequelize);

    // Hủy gán role cho admin@soyte.gov.vn
    await sequelize.query(
      q
        ? `UPDATE "users" SET role_id = NULL WHERE email = 'admin@soyte.gov.vn'`
        : `UPDATE [users] SET role_id = NULL WHERE email = 'admin@soyte.gov.vn'`,
      { transaction }
    );

    // Xóa role Admin (cascade xóa role_permissions)
    await sequelize.query(
      q
        ? `DELETE FROM "roles" WHERE name = 'Admin'`
        : `DELETE FROM [roles] WHERE name = 'Admin'`,
      { transaction }
    );

    // Xóa các permissions đã thêm
    const names = MISSING_PERMISSIONS.map(p => p[0]);
    for (const name of names) {
      await sequelize.query(
        q
          ? `DELETE FROM "permissions" WHERE name = :name`
          : `DELETE FROM [permissions] WHERE name = :name`,
        { replacements: { name }, transaction }
      );
    }

    console.log('      ✅ Rolled back: role Admin + permissions mở rộng.');
  },
};
