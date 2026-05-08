'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TradingFacilityOption extends Model {}

  TradingFacilityOption.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    kind: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'facility_type | trading_type',
    },
    value: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'TradingFacilityOption',
    tableName: 'trading_facility_options',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return TradingFacilityOption;
};
