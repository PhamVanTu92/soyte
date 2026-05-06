const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Survey extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations here if needed
    }
  }

  Survey.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Tên cuộc khảo sát',
    },
    type: {
      type: DataTypes.STRING(50), // Using STRING for better compatibility with MSSQL
      allowNull: false,
      comment: 'Loại khảo sát: reflect (phản ánh) hoặc evaluate (đánh giá)',
    },
    date_from: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Ngày bắt đầu',
    },
    date_to: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Ngày kết thúc',
    },
    form_ids: {
      type: DataTypes.TEXT, // Using TEXT for MSSQL instead of JSON
      allowNull: false,
      comment: 'Danh sách ID biểu mẫu liên quan',
      get() {
        const raw = this.getDataValue('form_ids');
        if (!raw) return [];
        if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            return [];
          }
        }
        return Array.isArray(raw) ? raw : [];
      },
      set(val) {
        this.setDataValue('form_ids', JSON.stringify(Array.isArray(val) ? val : []));
      }
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Trạng thái hoạt động',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Mô tả cuộc khảo sát',
    }
  }, {
    sequelize,
    modelName: 'Survey',
    tableName: 'surveys',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Survey;
};
