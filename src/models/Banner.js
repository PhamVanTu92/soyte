'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Banner extends Model {}

  Banner.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    position: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: { isIn: [['top', 'left', 'right', 'footer']] },
    },
    image_url:  { type: DataTypes.TEXT,         allowNull: false },
    title:      { type: DataTypes.STRING(255),   allowNull: true },
    link_url:   { type: DataTypes.TEXT,          allowNull: true },
    sort_order: { type: DataTypes.INTEGER,       defaultValue: 0 },
    is_active:  { type: DataTypes.BOOLEAN,       defaultValue: true },
  }, {
    sequelize,
    modelName: 'Banner',
    tableName: 'banners',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Banner;
};
