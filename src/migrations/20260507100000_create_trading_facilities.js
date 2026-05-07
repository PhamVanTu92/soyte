'use strict';

/**
 * Migration: create_trading_facilities
 * Tạo bảng quản lý cơ sở bán buôn, bán lẻ thuốc
 */

const isPG = (seq) => (seq.options.dialect || '') === 'postgres';

module.exports = {
  async up(sequelize, transaction) {
    if (isPG(sequelize)) {
      // Tạo bảng (dùng VARCHAR + CHECK thay vì ENUM để tránh lỗi transaction)
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "trading_facilities" (
          "id"                   SERIAL PRIMARY KEY,
          "certificate_number"   VARCHAR(100),
          "name"                 TEXT         NOT NULL,
          "person_in_charge"     VARCHAR(255),
          "practice_certificate" VARCHAR(100),
          "facility_type"        VARCHAR(100),
          "trading_type"         VARCHAR(20)  NOT NULL
            CHECK ("trading_type" IN ('wholesale','retail')),
          "address"              TEXT,
          "issue_date"           VARCHAR(30),
          "gps_number"           VARCHAR(50),
          "gps_issue_date"       VARCHAR(30),
          "is_active"            BOOLEAN      NOT NULL DEFAULT TRUE,
          "created_at"           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
          "updated_at"           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
        )
      `, { transaction });

      // Tạo từng index riêng lẻ
      await sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_tf_trading_type ON "trading_facilities"("trading_type")`,
        { transaction }
      );
      await sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_tf_facility_type ON "trading_facilities"("facility_type")`,
        { transaction }
      );
      await sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_tf_is_active ON "trading_facilities"("is_active")`,
        { transaction }
      );
      await sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_tf_cert ON "trading_facilities"("certificate_number")`,
        { transaction }
      );

    } else {
      await sequelize.query(`
        IF NOT EXISTS (
          SELECT 1 FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_NAME = 'trading_facilities'
        )
        BEGIN
          CREATE TABLE [trading_facilities] (
            [id]                   INT IDENTITY(1,1) PRIMARY KEY,
            [certificate_number]   NVARCHAR(100),
            [name]                 NVARCHAR(MAX)  NOT NULL,
            [person_in_charge]     NVARCHAR(255),
            [practice_certificate] NVARCHAR(100),
            [facility_type]        NVARCHAR(100),
            [trading_type]         NVARCHAR(20)   NOT NULL
              CONSTRAINT chk_trading_type CHECK ([trading_type] IN ('wholesale','retail')),
            [address]              NVARCHAR(MAX),
            [issue_date]           NVARCHAR(30),
            [gps_number]           NVARCHAR(50),
            [gps_issue_date]       NVARCHAR(30),
            [is_active]            BIT            NOT NULL DEFAULT 1,
            [created_at]           DATETIME2      NOT NULL DEFAULT GETDATE(),
            [updated_at]           DATETIME2      NOT NULL DEFAULT GETDATE()
          )
        END
      `, { transaction });
    }
  },

  async down(sequelize, transaction) {
    if (isPG(sequelize)) {
      await sequelize.query(`DROP TABLE IF EXISTS "trading_facilities"`, { transaction });
    } else {
      await sequelize.query(`
        IF OBJECT_ID('trading_facilities','U') IS NOT NULL
          DROP TABLE [trading_facilities]
      `, { transaction });
    }
  },
};
