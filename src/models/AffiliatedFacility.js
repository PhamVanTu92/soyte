const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AffiliatedFacility extends Model {}

  AffiliatedFacility.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    logo: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'AffiliatedFacility',
    tableName: 'affiliated_facilities',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return AffiliatedFacility;
};
