'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DatasetType extends Model {}

  DatasetType.init({
    id:          { type: DataTypes.INTEGER,   primaryKey: true, autoIncrement: true },
    code:        { type: DataTypes.STRING(100), allowNull: false, unique: true },
    name:        { type: DataTypes.TEXT,       allowNull: false },
    description: { type: DataTypes.TEXT,       allowNull: true },
    fields:      { type: DataTypes.JSONB,      allowNull: true },
    source_file: { type: DataTypes.TEXT,       allowNull: true },
  }, {
    sequelize,
    modelName:  'DatasetType',
    tableName:  'dataset_types',
    timestamps: true,
    createdAt:  'created_at',
    updatedAt:  'updated_at',
  });

  return DatasetType;
};
