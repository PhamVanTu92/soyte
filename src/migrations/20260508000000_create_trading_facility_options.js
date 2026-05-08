'use strict';

/**
 * Migration: trading_facility_options
 * - Tạo bảng lookup quản lý danh sách facility_type và trading_type
 * - Chuyển cột trading_type từ ENUM → VARCHAR(100) để linh hoạt
 * - Seed dữ liệu mặc định
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const isPG = queryInterface.sequelize.options.dialect === 'postgres';

    // ── 1. Tạo bảng trading_facility_options ───────────────────────
    await queryInterface.createTable('trading_facility_options', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      kind: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'facility_type | trading_type',
      },
      value: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Giá trị lưu trong DB (vd: wholesale, retail, nha_thuoc)',
      },
      label: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Nhãn hiển thị (vd: Bán buôn, Bán lẻ, Nhà thuốc)',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Unique: không được trùng kind + value
    await queryInterface.addIndex('trading_facility_options', ['kind', 'value'], {
      unique: true,
      name: 'uidx_tfo_kind_value',
    });

    // ── 2. Seed dữ liệu mặc định ────────────────────────────────────
    const now = new Date();
    await queryInterface.bulkInsert('trading_facility_options', [
      // trading_type
      { kind: 'trading_type', value: 'wholesale', label: 'Bán buôn', created_at: now, updated_at: now },
      { kind: 'trading_type', value: 'retail',    label: 'Bán lẻ',   created_at: now, updated_at: now },
      // facility_type — lấy từ dữ liệu thực tế phổ biến
      { kind: 'facility_type', value: 'Nhà thuốc',                     label: 'Nhà thuốc',                     created_at: now, updated_at: now },
      { kind: 'facility_type', value: 'Quầy thuốc',                    label: 'Quầy thuốc',                    created_at: now, updated_at: now },
      { kind: 'facility_type', value: 'Cơ sở bán buôn thuốc',          label: 'Cơ sở bán buôn thuốc',          created_at: now, updated_at: now },
      { kind: 'facility_type', value: 'Cơ sở kinh doanh dược liệu',    label: 'Cơ sở kinh doanh dược liệu',    created_at: now, updated_at: now },
      { kind: 'facility_type', value: 'Tủ thuốc trạm y tế',            label: 'Tủ thuốc trạm y tế',            created_at: now, updated_at: now },
    ]);

    // ── 3. Chuyển trading_type từ ENUM → VARCHAR(100) ───────────────
    if (isPG) {
      await queryInterface.sequelize.query(`
        ALTER TABLE trading_facilities
          ALTER COLUMN trading_type TYPE VARCHAR(100)
          USING trading_type::VARCHAR;
      `);
      // Xóa ENUM type cũ nếu tồn tại
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS "enum_trading_facilities_trading_type";
      `).catch(() => {});
    } else {
      await queryInterface.changeColumn('trading_facilities', 'trading_type', {
        type: Sequelize.STRING(100),
        allowNull: false,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const isPG = queryInterface.sequelize.options.dialect === 'postgres';

    // Rollback trading_type → ENUM
    if (isPG) {
      await queryInterface.sequelize.query(`
        ALTER TABLE trading_facilities
          ALTER COLUMN trading_type TYPE VARCHAR(20)
          USING trading_type::VARCHAR;
      `);
    }

    await queryInterface.dropTable('trading_facility_options');
  },
};
