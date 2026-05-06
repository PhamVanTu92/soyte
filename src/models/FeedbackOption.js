const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class FeedbackOption extends Model {
    static associate(models) {
      // Một option thuộc về một section
      FeedbackOption.belongsTo(models.FeedbackSection, {
        foreignKey: 'feedback_section_id',
        as: 'section',
      });
    }
  }

  FeedbackOption.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    feedback_section_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'feedback_sections', // Tên bảng
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    tiendo: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    danhgia: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ghichu: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Lưu trữ toàn bộ thông tin linh hoạt của option',
      get() {
        const raw = this.getDataValue('data');
        if (typeof raw === 'string') {
          try { return JSON.parse(raw); } catch { return raw; }
        }
        return raw;
      },
    }
  }, {
    sequelize,
    modelName: 'FeedbackOption',
    tableName: 'feedback_options',
    timestamps: false,
  });

  return FeedbackOption;
};
