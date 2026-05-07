'use strict';

/**
 * Migration: create_schedule_attendees
 * Junction table for WorkSchedule <-> User (N-N)
 */

const isPG = (seq) => (seq.options.dialect || '') === 'postgres';

module.exports = {
  async up(sequelize, transaction) {
    if (isPG(sequelize)) {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "schedule_attendees" (
          "schedule_id" BIGINT      NOT NULL,
          "user_id"     INTEGER     NOT NULL,
          PRIMARY KEY ("schedule_id", "user_id"),
          CONSTRAINT fk_sa_schedule FOREIGN KEY ("schedule_id")
            REFERENCES "work_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT fk_sa_user FOREIGN KEY ("user_id")
            REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `, { transaction });
    } else {
      await sequelize.query(`
        IF NOT EXISTS (
          SELECT 1 FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_NAME = 'schedule_attendees'
        )
        BEGIN
          CREATE TABLE [schedule_attendees] (
            [schedule_id] BIGINT  NOT NULL,
            [user_id]     INT     NOT NULL,
            CONSTRAINT PK_schedule_attendees PRIMARY KEY ([schedule_id], [user_id]),
            CONSTRAINT FK_sa_schedule FOREIGN KEY ([schedule_id])
              REFERENCES [work_schedules]([id]) ON DELETE CASCADE,
            CONSTRAINT FK_sa_user FOREIGN KEY ([user_id])
              REFERENCES [users]([id]) ON DELETE CASCADE
          )
        END
      `, { transaction });
    }
  },

  async down(sequelize, transaction) {
    if (isPG(sequelize)) {
      await sequelize.query(`DROP TABLE IF EXISTS "schedule_attendees"`, { transaction });
    } else {
      await sequelize.query(`
        IF OBJECT_ID('schedule_attendees', 'U') IS NOT NULL
          DROP TABLE [schedule_attendees]
      `, { transaction });
    }
  },
};
