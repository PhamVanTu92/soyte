'use strict';

const isPG = (seq) => (seq.options.dialect || '') === 'postgres';

module.exports = {
  async up(sequelize, transaction) {
    if (isPG(sequelize)) {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "banners" (
          "id"         SERIAL PRIMARY KEY,
          "position"   VARCHAR(20)  NOT NULL
            CHECK ("position" IN ('top','left','right','footer')),
          "image_url"  TEXT         NOT NULL,
          "title"      VARCHAR(255),
          "link_url"   TEXT,
          "sort_order" INTEGER      NOT NULL DEFAULT 0,
          "is_active"  BOOLEAN      NOT NULL DEFAULT TRUE,
          "created_at" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMPTZ  NOT NULL DEFAULT NOW()
        )
      `, { transaction });

      await sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_banners_position ON "banners"("position")`,
        { transaction }
      );
      await sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_banners_active ON "banners"("is_active")`,
        { transaction }
      );
    } else {
      await sequelize.query(`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='banners')
        BEGIN
          CREATE TABLE [banners] (
            [id]         INT IDENTITY(1,1) PRIMARY KEY,
            [position]   NVARCHAR(20)  NOT NULL
              CONSTRAINT chk_banner_position CHECK ([position] IN ('top','left','right','footer')),
            [image_url]  NVARCHAR(MAX) NOT NULL,
            [title]      NVARCHAR(255),
            [link_url]   NVARCHAR(MAX),
            [sort_order] INT           NOT NULL DEFAULT 0,
            [is_active]  BIT           NOT NULL DEFAULT 1,
            [created_at] DATETIME2     NOT NULL DEFAULT GETDATE(),
            [updated_at] DATETIME2     NOT NULL DEFAULT GETDATE()
          )
        END
      `, { transaction });
    }
  },

  async down(sequelize, transaction) {
    if (isPG(sequelize)) {
      await sequelize.query(`DROP TABLE IF EXISTS "banners"`, { transaction });
    } else {
      await sequelize.query(`
        IF OBJECT_ID('banners','U') IS NOT NULL DROP TABLE [banners]
      `, { transaction });
    }
  },
};
