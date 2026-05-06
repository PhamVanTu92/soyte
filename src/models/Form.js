const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Form extends Model {}

  Form.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Tên biểu mẫu',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Mô tả biểu mẫu',
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Loại biểu mẫu',
    },
    info: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Thông tin thêm (mảng object)',
      get() {
        const rawData = this.getDataValue('info');
        return rawData ? JSON.parse(rawData) : null;
      },
      set(value) {
        this.setDataValue('info', typeof value === 'string' ? value : JSON.stringify(value));
      }
    },
    data: {
      type: DataTypes.TEXT, // Changed from DataTypes.JSON
      allowNull: false,
      comment: 'Cấu trúc biểu mẫu động',
      get() {
        const rawData = this.getDataValue('data');
        return rawData ? JSON.parse(rawData) : null;
      },
      set(value) {
        this.setDataValue('data', typeof value === 'string' ? value : JSON.stringify(value));
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      comment: 'Trạng thái',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at'
    }
  }, {
    sequelize,
    modelName: 'Form',
    tableName: 'forms',
    paranoid: true, // This will enable soft deletes
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      {
        fields: ['status'],
      },
      {
        fields: ['type'],
      }
    ]
  });

  return Form;
};
