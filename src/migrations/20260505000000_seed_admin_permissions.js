'use strict';

/**
 * Migration: seed_admin_permissions
 * Gán tất cả permissions cho tất cả user có role = 'admin'
 * mà chưa có permission nào trong user_permissions.
 * Idempotent — chạy nhiều lần không bị trùng.
 * Tương thích: MSSQL & PostgreSQL
 */

module.exports = {
  async up(sequelize, transaction) {
    // 1. Lấy tất cả admin users
    const [admins] = await sequelize.query(
      `SELECT id, email FROM users WHERE role = 'admin'`,
      { transaction }
    );

    if (admins.length === 0) {
      console.log('      Không tìm thấy user nào có role = admin.');
      return;
    }

    // 2. Lấy tất cả permissions
    const [permissions] = await sequelize.query(
      `SELECT id, name FROM permissions ORDER BY id ASC`,
      { transaction }
    );

    if (permissions.length === 0) {
      console.log('      Bảng permissions rỗng. Hãy seed permissions trước.');
      return;
    }

    console.log(`      Admins tìm thấy: ${admins.map(a => a.email).join(', ')}`);
    console.log(`      Permissions tìm thấy: ${permissions.length} quyền`);

    let inserted = 0;
    let skipped  = 0;

    for (const admin of admins) {
      for (const perm of permissions) {
        const [exists] = await sequelize.query(
          `SELECT COUNT(*) AS cnt FROM user_permissions
           WHERE user_id = :userId AND permission_id = :permId`,
          { replacements: { userId: admin.id, permId: perm.id }, transaction }
        );

        // PostgreSQL trả COUNT dạng string, MSSQL trả number — parseInt xử lý cả hai
        if (parseInt(exists[0].cnt, 10) > 0) {
          skipped++;
          continue;
        }

        await sequelize.query(
          `INSERT INTO user_permissions (user_id, permission_id) VALUES (:userId, :permId)`,
          { replacements: { userId: admin.id, permId: perm.id }, transaction }
        );
        inserted++;
      }
    }

    console.log(`      ✅ Inserted: ${inserted} | Skipped (đã có): ${skipped}`);
  },

  async down(sequelize, transaction) {
    const [admins] = await sequelize.query(
      `SELECT id FROM users WHERE role = 'admin'`,
      { transaction }
    );

    for (const admin of admins) {
      await sequelize.query(
        `DELETE FROM user_permissions WHERE user_id = :userId`,
        { replacements: { userId: admin.id }, transaction }
      );
    }

    console.log('      ✅ Đã xóa tất cả permissions của admin users.');
  },
};
