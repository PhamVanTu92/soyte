'use strict';

/**
 * Migration: add_source_to_feedbacks
 * Thêm cột "source" để phân biệt kênh nộp phiếu:
 *   'qr'  → quét mã QR
 *   'web' → truy cập website / cổng dịch vụ công
 * Nullable để tương thích dữ liệu cũ (NULL → suy luận theo user_id ở tầng báo cáo).
 */

const isPG = (seq) => (seq.options.dialect || '') === 'postgres';

module.exports = {
  async up(sequelize, transaction) {
    if (isPG(sequelize)) {
      await sequelize.query(`
        ALTER TABLE "feedbacks"
        ADD COLUMN IF NOT EXISTS "source" VARCHAR(10)
      `, { transaction });
    } else {
      await sequelize.query(`
        IF NOT EXISTS (
          SELECT 1 FROM sys.columns
          WHERE Name = N'source' AND Object_ID = Object_ID(N'feedbacks')
        )
        BEGIN
          ALTER TABLE [feedbacks] ADD [source] NVARCHAR(10) NULL;
        END
      `, { transaction });
    }
  },

  async down(sequelize, transaction) {
    if (isPG(sequelize)) {
      await sequelize.query(
        `ALTER TABLE "feedbacks" DROP COLUMN IF EXISTS "source"`,
        { transaction }
      );
    } else {
      await sequelize.query(`
        IF EXISTS (
          SELECT 1 FROM sys.columns
          WHERE Name = N'source' AND Object_ID = Object_ID(N'feedbacks')
        )
          ALTER TABLE [feedbacks] DROP COLUMN [source];
      `, { transaction });
    }
  },
};
