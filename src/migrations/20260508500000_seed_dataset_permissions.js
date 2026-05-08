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
    // Parent: dataset
    const datasetId = await upsertPermission(sequelize, transaction, 'dataset', 'Module Quản lý Dataset động', null);

    await upsertPermission(sequelize, transaction, 'dataset.manage', 'Quản lý datasets & records', datasetId);

    // Assign to Admin role
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
        SELECT r.id, p.id
        FROM roles r, permissions p
        WHERE r.name = 'Admin' AND p.name LIKE 'dataset%'
        AND NOT EXISTS (
          SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
        )
      `, { transaction });
    }

    console.log('      ✅ Seeded dataset permissions & assigned to Admin role');
  },

  async down(sequelize, transaction) {
    await sequelize.query(
      `DELETE FROM permissions WHERE name LIKE 'dataset%'`,
      { transaction }
    );
    console.log('      ✅ Removed dataset permissions');
  },
};
