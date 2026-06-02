'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('survey_facilities', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      survey_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'surveys', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      facility_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'social_facilities', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    });

    await queryInterface.addIndex('survey_facilities', ['survey_id', 'facility_id'], {
      unique: true,
      name: 'idx_survey_facilities_unique',
    });
    await queryInterface.addIndex('survey_facilities', ['survey_id'], {
      name: 'idx_survey_facilities_survey_id',
    });
    await queryInterface.addIndex('survey_facilities', ['facility_id'], {
      name: 'idx_survey_facilities_facility_id',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('survey_facilities');
  },
};
