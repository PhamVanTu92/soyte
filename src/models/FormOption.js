'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class FormOption extends Model {
    static associate(models) {
      FormOption.belongsTo(models.FormQuestion, {
        foreignKey: 'question_id',
        as: 'question',
      });
    }
  }

  FormOption.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      question_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'form_questions', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      option_key: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Mã đáp án ("1","2","0","a","b"…) — khớp với feedback answers',
      },
      label: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
        comment: 'Nội dung đáp án hiển thị',
      },
      order_index: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Thứ tự hiển thị',
      },
    },
    {
      sequelize,
      modelName: 'FormOption',
      tableName: 'form_options',
      timestamps: false, // options không cần timestamp
      indexes: [{ fields: ['question_id'] }],
    },
  );

  return FormOption;
};
