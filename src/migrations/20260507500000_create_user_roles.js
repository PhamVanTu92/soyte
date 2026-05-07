'use strict';

/**
 * Migration: create_user_roles
 *
 * Tạo bảng junction user_roles (N:N giữa users và roles).
 * Đồng thời migrate dữ liệu hiện có: users.role_id → user_roles.
 *
 * Idempotent — chạy nhiều lần không bị lỗi.
 * Tương thích: PostgreSQL & MSSQL
 */

const isPG = (seq) => (seq.options.dialect || '') === 'postgres';

module.exports = {
  async up(sequelize, transaction) {
    const pg = isPG(sequelize);

    // ── 1. Tạo bảng user_roles ─────────────────────────────────────
    console.log('      [1/2] Tạo bảng user_roles...');
    if (pg) {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "user_roles" (
          "user_id"   INTEGER NOT NULL,
          "role_id"   INTEGER NOT NULL,
          PRIMARY KEY ("user_id", "role_id"),
          CONSTRAINT fk_ur_user FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
          CONSTRAINT fk_ur_role FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
        )
      `, { transaction });
    } else {
      await sequelize.query(`
        IF NOT EXISTS (
          SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'user_roles'
        )
        BEGIN
          CREATE TABLE [user_roles] (
            [user_id]  INT NOT NULL,
            [role_id]  INT NOT NULL,
            PRIMARY KEY ([user_id], [role_id]),
            CONSTRAINT fk_ur_user FOREIGN KEY ([user_id]) REFERENCES [users]([id]) ON DELETE CASCADE,
            CONSTRAINT fk_ur_role FOREIGN KEY ([role_id]) REFERENCES [roles]([id]) ON DELETE CASCADE
          )
        END
      `, { transaction });
    }
    console.log('      ✅ Bảng user_roles đã sẵn sàng.');

    // ── 2. Migrate dữ liệu từ users.role_id ───────────────────────
    console.log('      [2/2] Migrate dữ liệu users.role_id → user_roles...');
    if (pg) {
      await sequelize.query(`
        INSERT INTO "user_roles" ("user_id", "role_id")
        SELECT id, role_id FROM "users"
        WHERE role_id IS NOT NULL
        ON CONFLICT DO NOTHING
      `, { transaction });
    } else {
      await sequelize.query(`
        INSERT INTO [user_roles] ([user_id], [role_id])
        SELECT u.id, u.role_id FROM [users] u
        WHERE u.role_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM [user_roles] ur
            WHERE ur.user_id = u.id AND ur.role_id = u.role_id
          )
      `, { transaction });
    }
    console.log('      ✅ Migrate dữ liệu hoàn tất.');
  },

  async down(sequelize, transaction) {
    const pg = isPG(sequelize);
    if (pg) {
      await sequelize.query(`DROP TABLE IF EXISTS "user_roles"`, { transaction });
    } else {
      await sequelize.query(`
        IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'user_roles')
          DROP TABLE [user_roles]
      `, { transaction });
    }
    console.log('      ✅ Rolled back: bảng user_roles đã bị xóa.');
  },
};
