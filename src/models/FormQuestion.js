'use strict';
const { Model, DataTypes } = require('sequelize');

/** Các loại câu hỏi hợp lệ (theo mockup Bộ Y tế) */
const QUESTION_TYPES = ['likert', 'single', 'multi', 'text', 'textarea', 'number', 'date'];

module.exports = (sequelize) => {
  class FormQuestion extends Model {
    static associate(models) {
      FormQuestion.belongsTo(models.FormSection, {
        foreignKey: 'section_id',
        as: 'section',
      });
      FormQuestion.hasMany(models.FormOption, {
        foreignKey: 'question_id',
        as: 'options',
        onDelete: 'CASCADE',
      });
    }
  }

  FormQuestion.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      section_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'form_sections', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      question_key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Mã câu hỏi (A1, B3, G2 …) — dùng để map với feedback answers',
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'text',
        comment: `Loại: ${QUESTION_TYPES.join(' | ')}`,
        validate: { isIn: [QUESTION_TYPES] },
      },
      label: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
        comment: 'Nội dung câu hỏi',
      },
      required: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Câu hỏi bắt buộc?',
      },
      order_index: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Thứ tự trong section',
      },
      score_weight: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 1.0,
        comment: 'Trọng số khi tính điểm tổng hợp',
      },
    },
    {
      sequelize,
      modelName: 'FormQuestion',
      tableName: 'form_questions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['section_id'] },
        { fields: ['question_key'] },
        { fields: ['type'] },
      ],
    },
  );

  return FormQuestion;
};
