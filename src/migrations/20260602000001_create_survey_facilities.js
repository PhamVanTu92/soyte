'use strict';

/**
 * Migration: create_survey_facilities
 * Join table Survey <-> SocialFacility (N-N)
 */

const isPG = (seq) => (seq.options.dialect || '') === 'postgres';

module.exports = {
  async up(sequelize, transaction) {
    if (isPG(sequelize)) {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "survey_facilities" (
          "id"          SERIAL  NOT NULL,
          "survey_id"   INTEGER NOT NULL,
          "facility_id" INTEGER NOT NULL,
          PRIMARY KEY ("id"),
          CONSTRAINT uq_survey_facility UNIQUE ("survey_id", "facility_id"),
          CONSTRAINT fk_sf_survey   FOREIGN KEY ("survey_id")
            REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT fk_sf_facility FOREIGN KEY ("facility_id")
            REFERENCES "social_facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `, { transaction });

      await sequelize.query(
        `CREATE INDEX IF NOT EXISTS "idx_sf_survey_id"   ON "survey_facilities" ("survey_id")`,
        { transaction }
      );
      await sequelize.query(
        `CREATE INDEX IF NOT EXISTS "idx_sf_facility_id" ON "survey_facilities" ("facility_id")`,
        { transaction }
      );
    } else {
      await sequelize.query(`
        IF NOT EXISTS (
          SELECT 1 FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_NAME = 'survey_facilities'
        )
        BEGIN
          CREATE TABLE [survey_facilities] (
            [id]          INT IDENTITY(1,1) NOT NULL,
            [survey_id]   INT NOT NULL,
            [facility_id] INT NOT NULL,
            CONSTRAINT PK_survey_facilities PRIMARY KEY ([id]),
            CONSTRAINT UQ_survey_facility   UNIQUE ([survey_id], [facility_id]),
            CONSTRAINT FK_sf_survey   FOREIGN KEY ([survey_id])
              REFERENCES [surveys]([id]) ON DELETE CASCADE,
            CONSTRAINT FK_sf_facility FOREIGN KEY ([facility_id])
              REFERENCES [social_facilities]([id]) ON DELETE CASCADE
          );
          CREATE INDEX idx_sf_survey_id   ON [survey_facilities] ([survey_id]);
          CREATE INDEX idx_sf_facility_id ON [survey_facilities] ([facility_id]);
        END
      `, { transaction });
    }
  },

  async down(sequelize, transaction) {
    if (isPG(sequelize)) {
      await sequelize.query(
        `DROP TABLE IF EXISTS "survey_facilities"`,
        { transaction }
      );
    } else {
      await sequelize.query(`
        IF OBJECT_ID('survey_facilities', 'U') IS NOT NULL
          DROP TABLE [survey_facilities]
      `, { transaction });
    }
  },
};
