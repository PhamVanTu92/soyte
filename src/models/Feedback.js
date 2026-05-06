const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Feedback extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Một feedback có nhiều section
      Feedback.hasMany(models.FeedbackSection, {
        foreignKey: 'feedback_id',
        as: 'sections',
      });
    }
  }

  Feedback.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    form_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID của form mà feedback này thuộc về',
    },
    creator_name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Người gửi ẩn danh',
      comment: 'Tên người gửi',
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
      comment: 'Trạng thái của feedback',
    },
    info: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Thông tin thêm dự kiến (dạng array/object giống section)',
      get() {
        const raw = this.getDataValue('info');
        if (typeof raw === 'string') {
          try { return JSON.parse(raw); } catch { return raw; }
        }
        return raw;
      },
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Loại feedback',
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID của user gửi feedback (nếu có)',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    survey_key: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Key của survey liên kết với feedback này',
    }
  }, {
    sequelize,
    modelName: 'Feedback',
    tableName: 'feedbacks',
    paranoid: false,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Feedback;
};
