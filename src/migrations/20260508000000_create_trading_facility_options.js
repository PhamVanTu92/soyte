'use strict';

/**
 * Migration: create_trading_facility_options
 * - Tạo bảng lookup quản lý facility_type và trading_type
 * - Xóa CHECK constraint cũ trên trading_type (để nhận giá trị tự do từ lookup)
 * - Seed dữ liệu mặc định
 */

const isPG = (seq) => (seq.options.dialect || '') === 'postgres';

module.exports = {
  async up(sequelize, transaction) {
    if (isPG(sequelize)) {

      // ── 1. Tạo bảng lookup ──────────────────────────────────────
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "trading_facility_options" (
          "id"         SERIAL PRIMARY KEY,
          "kind"       VARCHAR(50)  NOT NULL,
          "value"      VARCHAR(100) NOT NULL,
          "label"      VARCHAR(255) NOT NULL,
          "created_at" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
          CONSTRAINT uidx_tfo_kind_value UNIQUE ("kind", "value")
        )
      `, { transaction });

      // ── 2. Xóa CHECK constraint cũ trên trading_type ────────────
      // Constraint tên có thể khác nhau, dùng pg_constraint để tìm
      await sequelize.query(`
        DO $$
        DECLARE cname TEXT;
        BEGIN
          SELECT conname INTO cname
          FROM pg_constraint
          WHERE conrelid = 'trading_facilities'::regclass
            AND contype = 'c'
            AND conname ILIKE '%trading_type%';
          IF cname IS NOT NULL THEN
            EXECUTE format('ALTER TABLE trading_facilities DROP CONSTRAINT %I', cname);
          END IF;
        END$$;
      `, { transaction });

      // ── 3. Mở rộng cột trading_type lên VARCHAR(100) ────────────
      await sequelize.query(`
        ALTER TABLE "trading_facilities"
          ALTER COLUMN "trading_type" TYPE VARCHAR(100)
          USING "trading_type"::VARCHAR
      `, { transaction });

      // ── 4. Seed dữ liệu mặc định ────────────────────────────────
      await sequelize.query(`
        INSERT INTO "trading_facility_options" ("kind","value","label") VALUES
          ('trading_type', 'wholesale',                  'Bán buôn'),
          ('trading_type', 'retail',                     'Bán lẻ'),
          ('facility_type','Nhà thuốc',                  'Nhà thuốc'),
          ('facility_type','Quầy thuốc',                 'Quầy thuốc'),
          ('facility_type','Cơ sở bán buôn thuốc',       'Cơ sở bán buôn thuốc'),
          ('facility_type','Cơ sở kinh doanh dược liệu', 'Cơ sở kinh doanh dược liệu'),
          ('facility_type','Tủ thuốc trạm y tế',         'Tủ thuốc trạm y tế')
        ON CONFLICT ("kind","value") DO NOTHING
      `, { transaction });

    } else {

      // ── MSSQL ────────────────────────────────────────────────────
      await sequelize.query(`
        IF NOT EXISTS (
          SELECT 1 FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_NAME = 'trading_facility_options'
        )
        BEGIN
          CREATE TABLE [trading_facility_options] (
            [id]         INT IDENTITY(1,1) PRIMARY KEY,
            [kind]       NVARCHAR(50)  NOT NULL,
            [value]      NVARCHAR(100) NOT NULL,
            [label]      NVARCHAR(255) NOT NULL,
            [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
            [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
            CONSTRAINT uidx_tfo_kind_value UNIQUE ([kind],[value])
          )
        END
      `, { transaction });

      // Xóa CHECK constraint trading_type cũ nếu có
      await sequelize.query(`
        DECLARE @cname NVARCHAR(255);
        SELECT @cname = name FROM sys.check_constraints
        WHERE parent_object_id = OBJECT_ID('trading_facilities')
          AND name LIKE '%trading_type%';
        IF @cname IS NOT NULL
          EXEC('ALTER TABLE [trading_facilities] DROP CONSTRAINT [' + @cname + ']');
      `, { transaction });

      await sequelize.query(`
        IF NOT EXISTS (
          SELECT 1 FROM [trading_facility_options]
          WHERE [kind]='trading_type' AND [value]='wholesale'
        )
        BEGIN
          INSERT INTO [trading_facility_options]([kind],[value],[label]) VALUES
            ('trading_type','wholesale','Bán buôn'),
            ('trading_type','retail',  'Bán lẻ'),
            ('facility_type','Nhà thuốc',                  'Nhà thuốc'),
            ('facility_type','Quầy thuốc',                 'Quầy thuốc'),
            ('facility_type','Cơ sở bán buôn thuốc',       'Cơ sở bán buôn thuốc'),
            ('facility_type','Cơ sở kinh doanh dược liệu', 'Cơ sở kinh doanh dược liệu'),
            ('facility_type','Tủ thuốc trạm y tế',         'Tủ thuốc trạm y tế')
        END
      `, { transaction });
    }
  },

  async down(sequelize, transaction) {
    if (isPG(sequelize)) {
      await sequelize.query(`DROP TABLE IF EXISTS "trading_facility_options"`, { transaction });
      // Khôi phục CHECK constraint
      await sequelize.query(`
        ALTER TABLE "trading_facilities"
          ADD CONSTRAINT chk_trading_type
          CHECK ("trading_type" IN ('wholesale','retail'))
      `, { transaction });
    } else {
      await sequelize.query(`
        IF OBJECT_ID('trading_facility_options','U') IS NOT NULL
          DROP TABLE [trading_facility_options]
      `, { transaction });
    }
  },
};
