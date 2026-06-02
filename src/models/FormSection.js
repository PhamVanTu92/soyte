'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class FormSection extends Model {
    static associate(models) {
      FormSection.belongsTo(models.Form, {
        foreignKey: 'form_id',
        as: 'form',
      });
      FormSection.hasMany(models.FormQuestion, {
        foreignKey: 'section_id',
        as: 'questions',
        onDelete: 'CASCADE',
      });
    }
  }

  FormSection.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      form_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'forms', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      title: {
        type: DataTypes.STRING(500),
        allowNull: false,
        defaultValue: '',
        comment: 'Tên phần (Section A, B …)',
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
      modelName: 'FormSection',
      tableName: 'form_sections',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );

  return FormSection;
};
