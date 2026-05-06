'use strict';

/**
 * Migration: add_password_changed_at
 * Thêm cột password_changed_at vào bảng users
 * để vô hiệu hoá token cũ khi đổi mật khẩu.
 */

const isPG = (seq) => (seq.options.dialect || '') === 'postgres';

module.exports = {
  async up(sequelize, transaction) {
    if (isPG(sequelize)) {
      // PostgreSQL: ADD COLUMN IF NOT EXISTS (pg 9.6+)
      await sequelize.query(`
        ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "password_changed_at" TIMESTAMPTZ NULL
      `, { transaction });
    } else {
      // MSSQL
      await sequelize.query(`
        IF NOT EXISTS (
          SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password_changed_at'
        )
        BEGIN
          ALTER TABLE [users] ADD [password_changed_at] DATETIME2 NULL
        END
      `, { transaction });
    }
  },

  async down(sequelize, transaction) {
    if (isPG(sequelize)) {
      await sequelize.query(`
        ALTER TABLE "users"
        DROP COLUMN IF EXISTS "password_changed_at"
      `, { transaction });
    } else {
      await sequelize.query(`
        IF EXISTS (
          SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password_changed_at'
        )
        BEGIN
          ALTER TABLE [users] DROP COLUMN [password_changed_at]
        END
      `, { transaction });
    }
  },
};
