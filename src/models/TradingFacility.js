const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TradingFacility extends Model {}

  TradingFacility.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    certificate_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Giấy chứng nhận đăng ký kinh doanh dược',
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Tên cơ sở',
    },
    person_in_charge: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Người phụ trách chuyên môn',
    },
    practice_certificate: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Số chứng chỉ hành nghề',
    },
    facility_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Loại hình: Cơ sở bán buôn thuốc / Nhà thuốc / Quầy thuốc / ...',
    },
    trading_type: {
      type: DataTypes.ENUM('wholesale', 'retail'),
      allowNull: false,
      comment: 'Phân loại: wholesale = bán buôn, retail = bán lẻ',
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Địa chỉ hành nghề',
    },
    issue_date: {
      type: DataTypes.STRING(30),
      allowNull: true,
      comment: 'Ngày cấp giấy chứng nhận',
    },
    gps_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Số Giấy phép sản xuất (GPs)',
    },
    gps_issue_date: {
      type: DataTypes.STRING(30),
      allowNull: true,
      comment: 'Ngày cấp GPs',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Trạng thái hoạt động',
    },
  }, {
    sequelize,
    modelName: 'TradingFacility',
    tableName: 'trading_facilities',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['trading_type'] },
      { fields: ['facility_type'] },
      { fields: ['is_active'] },
      { fields: ['certificate_number'] },
    ],
  });

  return TradingFacility;
};
