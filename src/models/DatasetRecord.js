'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DatasetRecord extends Model {}

  DatasetRecord.init({
    id:              { type: DataTypes.BIGINT,  primaryKey: true, autoIncrement: true },
    dataset_type_id: { type: DataTypes.INTEGER, allowNull: false },
    data:            { type: DataTypes.JSONB,   allowNull: false },
  }, {
    sequelize,
    modelName:  'DatasetRecord',
    tableName:  'dataset_records',
    timestamps: true,
    createdAt:  'created_at',
    updatedAt:  'updated_at',
  });

  DatasetRecord.associate = (db) => {
    DatasetRecord.belongsTo(db.DatasetType, {
      foreignKey: 'dataset_type_id',
      as: 'datasetType',
    });
  };

  return DatasetRecord;
};
