'use strict';

/**
 * Migration: create_roles_and_role_permissions
 * - Tạo bảng roles
 * - Tạo bảng role_permissions (junction)
 * - Thêm cột role_id vào users
 */

const isPG = (seq) => (seq.options.dialect || '') === 'postgres';

module.exports = {
  async up(sequelize, transaction) {
    if (isPG(sequelize)) {
      // 1. Tạo bảng roles
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "roles" (
          "id"          SERIAL PRIMARY KEY,
          "name"        VARCHAR(100) NOT NULL UNIQUE,
          "description" VARCHAR(500),
          "is_active"   BOOLEAN      NOT NULL DEFAULT TRUE,
          "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
          "updated_at"  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
        )
      `, { transaction });

      // 2. Tạo bảng role_permissions
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "role_permissions" (
          "role_id"       INTEGER NOT NULL,
          "permission_id" INTEGER NOT NULL,
          PRIMARY KEY ("role_id", "permission_id"),
          CONSTRAINT fk_rp_role FOREIGN KEY ("role_id")
            REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT fk_rp_permission FOREIGN KEY ("permission_id")
            REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `, { transaction });

      // 3. Thêm cột role_id vào users (nullable — user có thể không có role)
      await sequelize.query(`
        ALTER TABLE "users"
          ADD COLUMN IF NOT EXISTS "role_id" INTEGER
          REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE
      `, { transaction });

      await sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_users_role_id ON "users"("role_id")`,
        { transaction }
      );

    } else {
      // MSSQL
      await sequelize.query(`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'roles')
        BEGIN
          CREATE TABLE [roles] (
            [id]          INT IDENTITY(1,1) PRIMARY KEY,
            [name]        NVARCHAR(100) NOT NULL UNIQUE,
            [description] NVARCHAR(500),
            [is_active]   BIT           NOT NULL DEFAULT 1,
            [created_at]  DATETIME2     NOT NULL DEFAULT GETDATE(),
            [updated_at]  DATETIME2     NOT NULL DEFAULT GETDATE()
          )
        END
      `, { transaction });

      await sequelize.query(`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'role_permissions')
        BEGIN
          CREATE TABLE [role_permissions] (
            [role_id]       INT NOT NULL,
            [permission_id] INT NOT NULL,
            CONSTRAINT PK_role_permissions PRIMARY KEY ([role_id],[permission_id]),
            CONSTRAINT FK_rp_role FOREIGN KEY ([role_id])
              REFERENCES [roles]([id]) ON DELETE CASCADE,
            CONSTRAINT FK_rp_permission FOREIGN KEY ([permission_id])
              REFERENCES [permissions]([id]) ON DELETE CASCADE
          )
        END
      `, { transaction });

      await sequelize.query(`
        IF NOT EXISTS (
          SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'role_id'
        )
        BEGIN
          ALTER TABLE [users] ADD [role_id] INT NULL
            CONSTRAINT FK_users_role FOREIGN KEY REFERENCES [roles]([id]) ON DELETE SET NULL
        END
      `, { transaction });
    }
  },

  async down(sequelize, transaction) {
    if (isPG(sequelize)) {
      await sequelize.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "role_id"`, { transaction });
      await sequelize.query(`DROP TABLE IF EXISTS "role_permissions"`, { transaction });
      await sequelize.query(`DROP TABLE IF EXISTS "roles"`, { transaction });
    } else {
      await sequelize.query(`
        IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='users' AND COLUMN_NAME='role_id')
          ALTER TABLE [users] DROP CONSTRAINT FK_users_role;
        IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='users' AND COLUMN_NAME='role_id')
          ALTER TABLE [users] DROP COLUMN [role_id];
        IF OBJECT_ID('role_permissions','U') IS NOT NULL DROP TABLE [role_permissions];
        IF OBJECT_ID('roles','U') IS NOT NULL DROP TABLE [roles];
      `, { transaction });
    }
  },
};
