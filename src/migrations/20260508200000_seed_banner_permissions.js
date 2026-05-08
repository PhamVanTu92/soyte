'use strict';

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
    // Parent: banner
    const bannerId = await upsertPermission(sequelize, transaction, 'banner', 'Module Quản lý Banner', null);

    const children = [
      { name: 'banner.view',   desc: 'Xem danh sách banner' },
      { name: 'banner.create', desc: 'Tạo banner mới' },
      { name: 'banner.update', desc: 'Cập nhật banner' },
      { name: 'banner.delete', desc: 'Xóa banner' },
    ];

    for (const { name, desc } of children) {
      await upsertPermission(sequelize, transaction, name, desc, bannerId);
    }

    console.log('      ✅ Seeded banner permissions (banner, banner.view, banner.create, banner.update, banner.delete)');
  },

  async down(sequelize, transaction) {
    await sequelize.query(
      `DELETE FROM permissions WHERE name LIKE 'banner%'`,
      { transaction }
    );
    console.log('      ✅ Removed banner permissions');
  },
};
