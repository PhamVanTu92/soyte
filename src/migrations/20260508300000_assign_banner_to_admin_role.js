'use strict';

/**
 * Migration: assign_banner_to_admin_role
 * Gán banner permissions vào role Admin.
 * Idempotent — chạy nhiều lần không bị lỗi.
 */

const isPG = (seq) => (seq.options.dialect || '') === 'postgres';

module.exports = {
  async up(sequelize, transaction) {
    const q = isPG(sequelize);

    // Lấy id role Admin
    const [roleRows] = await sequelize.query(
      q ? `SELECT id FROM "roles" WHERE name = 'Admin'`
        : `SELECT id FROM [roles] WHERE name = 'Admin'`,
      { transaction }
    );
    if (roleRows.length === 0) {
      console.log('      ⚠️  Không tìm thấy role Admin — bỏ qua.');
      return;
    }
    const adminRoleId = roleRows[0].id;

    // Lấy tất cả banner permissions
    const [permRows] = await sequelize.query(
      q ? `SELECT id, name FROM "permissions" WHERE name LIKE 'banner%'`
        : `SELECT id, name FROM [permissions] WHERE name LIKE 'banner%'`,
      { transaction }
    );
    if (permRows.length === 0) {
      console.log('      ⚠️  Không tìm thấy banner permissions — bỏ qua.');
      return;
    }

    let inserted = 0, skipped = 0;
    for (const perm of permRows) {
      const [exists] = await sequelize.query(
        q
          ? `SELECT 1 FROM "role_permissions" WHERE role_id = :rId AND permission_id = :pId`
          : `SELECT 1 FROM [role_permissions] WHERE role_id = :rId AND permission_id = :pId`,
        { replacements: { rId: adminRoleId, pId: perm.id }, transaction }
      );
      if (exists.length > 0) { skipped++; continue; }

      await sequelize.query(
        q
          ? `INSERT INTO "role_permissions" (role_id, permission_id) VALUES (:rId, :pId)`
          : `INSERT INTO [role_permissions] ([role_id],[permission_id]) VALUES (:rId,:pId)`,
        { replacements: { rId: adminRoleId, pId: perm.id }, transaction }
      );
      inserted++;
    }

    console.log(`      ✅ Gán banner permissions vào role Admin: inserted=${inserted}, skipped=${skipped}`);
  },

  async down(sequelize, transaction) {
    const q = isPG(sequelize);

    const [roleRows] = await sequelize.query(
      q ? `SELECT id FROM "roles" WHERE name = 'Admin'`
        : `SELECT id FROM [roles] WHERE name = 'Admin'`,
      { transaction }
    );
    if (roleRows.length === 0) return;
    const adminRoleId = roleRows[0].id;

    const [permRows] = await sequelize.query(
      q ? `SELECT id FROM "permissions" WHERE name LIKE 'banner%'`
        : `SELECT id FROM [permissions] WHERE name LIKE 'banner%'`,
      { transaction }
    );
    for (const perm of permRows) {
      await sequelize.query(
        q
          ? `DELETE FROM "role_permissions" WHERE role_id = :rId AND permission_id = :pId`
          : `DELETE FROM [role_permissions] WHERE role_id = :rId AND permission_id = :pId`,
        { replacements: { rId: adminRoleId, pId: perm.id }, transaction }
      );
    }
    console.log('      ✅ Rolled back: banner permissions removed from role Admin.');
  },
};
