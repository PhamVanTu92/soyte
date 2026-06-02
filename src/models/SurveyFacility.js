const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class SurveyFacility extends Model {
    static associate(models) {
      SurveyFacility.belongsTo(models.Survey, {
        foreignKey: 'survey_id',
        as: 'survey',
      });
      SurveyFacility.belongsTo(models.SocialFacility, {
        foreignKey: 'facility_id',
        as: 'facility',
      });
    }
  }

  SurveyFacility.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    survey_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'surveys', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    facility_id: {
      type: DataTypes.STRING(50),   // social_facilities.id là VARCHAR(50)
      allowNull: false,
      references: { model: 'social_facilities', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  }, {
    sequelize,
    modelName: 'SurveyFacility',
    tableName: 'survey_facilities',
    timestamps: false,
    indexes: [
      { unique: true, fields: ['survey_id', 'facility_id'] },
      { fields: ['survey_id'] },
      { fields: ['facility_id'] },
    ],
  });

  return SurveyFacility;
};
