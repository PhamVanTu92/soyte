'use strict';

/**
 * Fix dataset permissions:
 * - Thêm dataset.view (bị thiếu ở migration trước)
 * - Đảm bảo toàn bộ dataset.* được gán cho Admin role
 *
 * Lý do cần dataset.view:
 *   formatPermissions() build tree từ permission names.
 *   hasNestedPermission() yêu cầu node cha phải có view: true
 *   để pass check cho cả 'dataset' lẫn 'dataset.manage'.
 */

const isPG = (seq) => (seq.options.dialect || '') === 'postgres';

async function upsertPermission(sequelize, transaction, name, description, parentId) {
  const [existing] = await sequelize.query(
    `SELECT id FROM permissions WHERE name = :name`,
    { replacements: { name }, transaction }
  );
  if (existing.length > 0) return existing[0].id;

  if (isPG(sequelize)) {
    const [inserted] = await sequelize.query(
      `INSERT INTO permissions (name, description, parent_id, created_at, updated_at)
       VALUES (:name, :desc, :parentId, NOW(), NOW())
       RETURNING id`,
      { replacements: { name, desc: description, parentId: parentId ?? null }, transaction }
    );
    return inserted[0].id;
  } else {
    await sequelize.query(
      `INSERT INTO [permissions] ([name], [description], [parent_id], [created_at], [updated_at])
       VALUES (:name, :desc, :parentId, GETDATE(), GETDATE())`,
      { replacements: { name, desc: description, parentId: parentId ?? null }, transaction }
    );
    const [newRow] = await sequelize.query(
      `SELECT [id] FROM [permissions] WHERE [name] = :name`,
      { replacements: { name }, transaction }
    );
    return newRow[0].id;
  }
}

module.exports = {
  async up(sequelize, transaction) {
    // Lấy parent id của 'dataset'
    const [[datasetRow]] = await sequelize.query(
      `SELECT id FROM permissions WHERE name = 'dataset'`,
      { transaction }
    );
    if (!datasetRow) {
      console.log('      ⚠️  Permission "dataset" chưa tồn tại, bỏ qua.');
      return;
    }
    const datasetId = datasetRow.id;

    // Thêm dataset.view (thiếu ở migration 20260508500000)
    await upsertPermission(sequelize, transaction, 'dataset.view', 'Xem danh sách dataset', datasetId);

    // Gán toàn bộ dataset.* vào Admin role (idempotent)
    if (isPG(sequelize)) {
      await sequelize.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id
        FROM roles r, permissions p
        WHERE r.name = 'Admin' AND p.name LIKE 'dataset%'
        ON CONFLICT DO NOTHING
      `, { transaction });
    } else {
      await sequelize.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM roles r, permissions p
        WHERE r.name = 'Admin' AND p.name LIKE 'dataset%'
          AND NOT EXISTS (
            SELECT 1 FROM role_permissions rp
            WHERE rp.role_id = r.id AND rp.permission_id = p.id
          )
      `, { transaction });
    }

    console.log('      ✅ Thêm dataset.view + gán đủ dataset.* cho Admin role');
  },

  async down(sequelize, transaction) {
    await sequelize.query(
      `DELETE FROM permissions WHERE name = 'dataset.view'`,
      { transaction }
    );
    console.log('      ✅ Đã xóa dataset.view');
  },
};
