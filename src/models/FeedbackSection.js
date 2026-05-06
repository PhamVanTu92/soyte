const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class FeedbackSection extends Model {
    static associate(models) {
      // Một section thuộc về một feedback
      FeedbackSection.belongsTo(models.Feedback, {
        foreignKey: 'feedback_id',
        as: 'feedback',
      });
      // Một section có nhiều option
      FeedbackSection.hasMany(models.FeedbackOption, {
        foreignKey: 'feedback_section_id',
        as: 'option',
      });
    }
  }

  FeedbackSection.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    feedback_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'feedbacks', // Tên bảng
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Tên của section, ví dụ: "Section 1"',
    },
  }, {
    sequelize,
    modelName: 'FeedbackSection',
    tableName: 'feedback_sections',
    timestamps: false, // Thường thì bảng con không cần timestamps riêng
  });

  return FeedbackSection;
};
