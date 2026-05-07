'use strict';

/**
 * Migration: create_initial_schema
 *
 * Tạo toàn bộ bảng gốc của hệ thống.
 * Phải chạy TRƯỚC mọi migration khác.
 *
 * Idempotent — IF NOT EXISTS ở mọi bước.
 * Tương thích: PostgreSQL & MSSQL
 */

const isPG = (seq) => (seq.options.dialect || '') === 'postgres';

module.exports = {
  async up(sequelize, transaction) {
    const pg = isPG(sequelize);
    console.log(`      dialect: ${pg ? 'PostgreSQL' : 'MSSQL'}`);

    if (pg) {
      // ──────────────────────────────────────────────────────────────
      // PostgreSQL
      // ──────────────────────────────────────────────────────────────

      // 1. social_facilities
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "social_facilities" (
          "id"          VARCHAR(50)   NOT NULL,
          "name"        VARCHAR(255)  NOT NULL,
          "type"        VARCHAR(100),
          "category"    VARCHAR(100),
          "address"     VARCHAR(500),
          "phone"       VARCHAR(20),
          "latitude"    FLOAT,
          "longitude"   FLOAT,
          "description" TEXT,
          "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
          "updated_at"  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
          PRIMARY KEY ("id")
        )
      `, { transaction });

      // 2. permissions (self-referential)
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "permissions" (
          "id"          SERIAL        PRIMARY KEY,
          "parent_id"   INTEGER       REFERENCES "permissions"("id") ON DELETE SET NULL,
          "name"        VARCHAR(255)  NOT NULL UNIQUE,
          "description" VARCHAR(500),
          "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
          "updated_at"  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
        )
      `, { transaction });

      // 3. email_confirm
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "email_confirm" (
          "id"          SERIAL        PRIMARY KEY,
          "smtp_host"   VARCHAR(255)  NOT NULL DEFAULT 'smtp.gmail.com',
          "smtp_port"   INTEGER       NOT NULL DEFAULT 587,
          "smtp_secure" BOOLEAN       NOT NULL DEFAULT FALSE,
          "smtp_user"   VARCHAR(255)  NOT NULL,
          "smtp_pass"   VARCHAR(255)  NOT NULL,
          "status"      INTEGER       NOT NULL DEFAULT -1,
          "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
          "updated_at"  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
        )
      `, { transaction });

      // 4. affiliated_facilities
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "affiliated_facilities" (
          "id"         SERIAL        PRIMARY KEY,
          "name"       VARCHAR(255)  NOT NULL,
          "logo"       VARCHAR(500),
          "created_at" TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMPTZ   NOT NULL DEFAULT NOW()
        )
      `, { transaction });

      // 5. users
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "users" (
          "id"                   SERIAL        PRIMARY KEY,
          "username"             VARCHAR(255),
          "email"                VARCHAR(255)  NOT NULL UNIQUE,
          "password"             VARCHAR(255)  NOT NULL,
          "full_name"            VARCHAR(255),
          "role"                 VARCHAR(20)   NOT NULL DEFAULT 'user',
          "status"               INTEGER       NOT NULL DEFAULT -1,
          "unit"                 VARCHAR(50),
          "is_verified"          BOOLEAN       NOT NULL DEFAULT FALSE,
          "reset_password_token" VARCHAR(255),
          "reset_password_expires" TIMESTAMPTZ,
          "type"                 VARCHAR(100),
          "created_at"           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
          "updated_at"           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
        )
      `, { transaction });

      // 6. user_permissions (junction)
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "user_permissions" (
          "user_id"       INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "permission_id" INTEGER NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
          PRIMARY KEY ("user_id", "permission_id")
        )
      `, { transaction });

      // 7. posts
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "posts" (
          "id"          SERIAL        PRIMARY KEY,
          "category_id" INTEGER,
          "author_id"   INTEGER       REFERENCES "users"("id") ON DELETE SET NULL,
          "title"       VARCHAR(255)  NOT NULL,
          "summary"     TEXT,
          "content"     TEXT,
          "image_url"   TEXT,
          "status"      VARCHAR(20)   NOT NULL DEFAULT 'draft',
          "view_count"  INTEGER       NOT NULL DEFAULT 0,
          "is_featured" BOOLEAN       NOT NULL DEFAULT FALSE,
          "expires_at"  TIMESTAMPTZ,
          "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
        )
      `, { transaction });

      // 8. forms
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "forms" (
          "id"          SERIAL        PRIMARY KEY,
          "name"        VARCHAR(255)  NOT NULL,
          "description" TEXT,
          "type"        VARCHAR(100),
          "info"        TEXT,
          "data"        TEXT          NOT NULL,
          "status"      VARCHAR(20)   NOT NULL DEFAULT 'active',
          "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
          "updated_at"  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
          "deleted_at"  TIMESTAMPTZ
        )
      `, { transaction });

      // 9. surveys
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "surveys" (
          "id"          SERIAL        PRIMARY KEY,
          "name"        VARCHAR(255)  NOT NULL,
          "type"        VARCHAR(50)   NOT NULL,
          "date_from"   DATE          NOT NULL,
          "date_to"     DATE          NOT NULL,
          "form_ids"    TEXT          NOT NULL DEFAULT '[]',
          "status"      BOOLEAN       NOT NULL DEFAULT TRUE,
          "description" TEXT,
          "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
          "updated_at"  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
        )
      `, { transaction });

      // 10. feedbacks
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "feedbacks" (
          "id"           SERIAL        PRIMARY KEY,
          "form_id"      INTEGER       NOT NULL,
          "creator_name" VARCHAR(255)  NOT NULL DEFAULT 'Người gửi ẩn danh',
          "status"       VARCHAR(20)   NOT NULL DEFAULT 'pending',
          "info"         TEXT,
          "type"         VARCHAR(100),
          "user_id"      INTEGER       REFERENCES "users"("id") ON DELETE SET NULL,
          "survey_key"   VARCHAR(50),
          "created_at"   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
          "updated_at"   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
        )
      `, { transaction });
      await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_feedbacks_form_id    ON "feedbacks"("form_id")`, { transaction });
      await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_feedbacks_survey_key ON "feedbacks"("survey_key")`, { transaction });
      await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_feedbacks_type       ON "feedbacks"("type")`, { transaction });

      // 11. feedback_sections
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "feedback_sections" (
          "id"          SERIAL        PRIMARY KEY,
          "feedback_id" INTEGER       NOT NULL REFERENCES "feedbacks"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          "name"        VARCHAR(255)  NOT NULL
        )
      `, { transaction });

      // 12. feedback_options
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "feedback_options" (
          "id"                  SERIAL    PRIMARY KEY,
          "feedback_section_id" INTEGER   NOT NULL REFERENCES "feedback_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          "tiendo"              INTEGER,
          "danhgia"             INTEGER,
          "ghichu"              TEXT,
          "data"                TEXT
        )
      `, { transaction });

      // 13. work_schedules
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "work_schedules" (
          "id"                BIGSERIAL     PRIMARY KEY,
          "title"             VARCHAR(255)  NOT NULL,
          "content"           TEXT,
          "start_time"        TIMESTAMPTZ   NOT NULL,
          "end_time"          TIMESTAMPTZ   NOT NULL,
          "location"          VARCHAR(500),
          "coordinating_unit" VARCHAR(255),
          "status"            VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
          "priority"          VARCHAR(20)   NOT NULL DEFAULT 'NORMAL',
          "internal_notes"    TEXT,
          "license_plate"     VARCHAR(20),
          "created_by"        INTEGER       NOT NULL REFERENCES "users"("id"),
          "approved_by"       INTEGER       REFERENCES "users"("id"),
          "presider_id"       INTEGER       REFERENCES "users"("id"),
          "created_at"        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
          "updated_at"        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
        )
      `, { transaction });
      await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_ws_start_time ON "work_schedules"("start_time")`, { transaction });
      await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_ws_status     ON "work_schedules"("status")`, { transaction });

      // 14. schedule_attachments
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "schedule_attachments" (
          "id"          BIGSERIAL     PRIMARY KEY,
          "schedule_id" BIGINT        NOT NULL REFERENCES "work_schedules"("id") ON DELETE CASCADE,
          "file_name"   VARCHAR(255)  NOT NULL,
          "file_path"   VARCHAR(500)  NOT NULL,
          "file_type"   VARCHAR(50),
          "uploaded_at" TIMESTAMPTZ   NOT NULL DEFAULT NOW()
        )
      `, { transaction });

      // 15. trading_facilities
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "trading_facilities" (
          "id"                  SERIAL        PRIMARY KEY,
          "certificate_number"  VARCHAR(100),
          "name"                TEXT          NOT NULL,
          "person_in_charge"    VARCHAR(255),
          "practice_certificate" VARCHAR(100),
          "facility_type"       VARCHAR(100),
          "trading_type"        VARCHAR(20)   NOT NULL,
          "address"             TEXT,
          "issue_date"          VARCHAR(30),
          "gps_number"          VARCHAR(50),
          "gps_issue_date"      VARCHAR(30),
          "is_active"           BOOLEAN       NOT NULL DEFAULT TRUE,
          "created_at"          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
          "updated_at"          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
        )
      `, { transaction });

    } else {
      // ──────────────────────────────────────────────────────────────
      // MSSQL
      // ──────────────────────────────────────────────────────────────

      // 1. social_facilities
      await sequelize.query(`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='social_facilities')
        BEGIN
          CREATE TABLE [social_facilities] (
            [id]          NVARCHAR(50)   NOT NULL PRIMARY KEY,
            [name]        NVARCHAR(255)  NOT NULL,
            [type]        NVARCHAR(100),
            [category]    NVARCHAR(100),
            [address]     NVARCHAR(500),
            [phone]       NVARCHAR(20),
            [latitude]    FLOAT,
            [longitude]   FLOAT,
            [description] NVARCHAR(MAX),
            [created_at]  DATETIME2      NOT NULL DEFAULT GETDATE(),
            [updated_at]  DATETIME2      NOT NULL DEFAULT GETDATE()
          )
        END
      `, { transaction });

      // 2. permissions
      await sequelize.query(`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='permissions')
        BEGIN
          CREATE TABLE [permissions] (
            [id]          INT IDENTITY(1,1) PRIMARY KEY,
            [parent_id]   INT,
            [name]        NVARCHAR(255) NOT NULL UNIQUE,
            [description] NVARCHAR(500),
            [created_at]  DATETIME2     NOT NULL DEFAULT GETDATE(),
            [updated_at]  DATETIME2     NOT NULL DEFAULT GETDATE()
          )
          ALTER TABLE [permissions]
            ADD CONSTRAINT FK_perm_parent FOREIGN KEY ([parent_id])
            REFERENCES [permissions]([id]) ON DELETE NO ACTION
        END
      `, { transaction });

      // 3. email_confirm
      await sequelize.query(`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='email_confirm')
        BEGIN
          CREATE TABLE [email_confirm] (
            [id]          INT IDENTITY(1,1) PRIMARY KEY,
            [smtp_host]   NVARCHAR(255) NOT NULL DEFAULT 'smtp.gmail.com',
            [smtp_port]   INT           NOT NULL DEFAULT 587,
            [smtp_secure] BIT           NOT NULL DEFAULT 0,
            [smtp_user]   NVARCHAR(255) NOT NULL,
            [smtp_pass]   NVARCHAR(255) NOT NULL,
            [status]      INT           NOT NULL DEFAULT -1,
            [created_at]  DATETIME2     NOT NULL DEFAULT GETDATE(),
            [updated_at]  DATETIME2     NOT NULL DEFAULT GETDATE()
          )
        END
      `, { transaction });

      // 4. affiliated_facilities
      await sequelize.query(`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='affiliated_facilities')
        BEGIN
          CREATE TABLE [affiliated_facilities] (
            [id]         INT IDENTITY(1,1) PRIMARY KEY,
            [name]       NVARCHAR(255) NOT NULL,
            [logo]       NVARCHAR(500),
            [created_at] DATETIME2     NOT NULL DEFAULT GETDATE(),
            [updated_at] DATETIME2     NOT NULL DEFAULT GETDATE()
          )
        END
      `, { transaction });

      // 5. users
      await sequelize.query(`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='users')
        BEGIN
          CREATE TABLE [users] (
            [id]                     INT IDENTITY(1,1) PRIMARY KEY,
            [username]               NVARCHAR(255),
            [email]                  NVARCHAR(255)  NOT NULL UNIQUE,
            [password]               NVARCHAR(255)  NOT NULL,
            [full_name]              NVARCHAR(255),
            [role]                   NVARCHAR(20)   NOT NULL DEFAULT 'user',
            [status]                 INT            NOT NULL DEFAULT -1,
            [unit]                   NVARCHAR(50),
            [is_verified]            BIT            NOT NULL DEFAULT 0,
            [reset_password_token]   NVARCHAR(255),
            [reset_password_expires] DATETIME2,
            [type]                   NVARCHAR(100),
            [created_at]             DATETIME2      NOT NULL DEFAULT GETDATE(),
            [updated_at]             DATETIME2      NOT NULL DEFAULT GETDATE()
          )
        END
      `, { transaction });

      // 6. user_permissions
      await sequelize.query(`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='user_permissions')
        BEGIN
          CREATE TABLE [user_permissions] (
            [user_id]       INT NOT NULL,
            [permission_id] INT NOT NULL,
            CONSTRAINT PK_user_permissions PRIMARY KEY ([user_id],[permission_id]),
            CONSTRAINT FK_up_user FOREIGN KEY ([user_id])
              REFERENCES [users]([id]) ON DELETE CASCADE,
            CONSTRAINT FK_up_perm FOREIGN KEY ([permission_id])
              REFERENCES [permissions]([id]) ON DELETE CASCADE
          )
        END
      `, { transaction });

      // 7. posts
      await sequelize.query(`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='posts')
        BEGIN
          CREATE TABLE [posts] (
            [id]          INT IDENTITY(1,1) PRIMARY KEY,
            [category_id] INT,
            [author_id]   INT,
            [title]       NVARCHAR(255)  NOT NULL,
            [summary]     NVARCHAR(MAX),
            [content]     NVARCHAR(MAX),
            [image_url]   NVARCHAR(MAX),
            [status]      NVARCHAR(20)   NOT NULL DEFAULT 'draft',
            [view_count]  INT            NOT NULL DEFAULT 0,
            [is_featured] BIT            NOT NULL DEFAULT 0,
            [expires_at]  DATETIME2,
            [created_at]  DATETIME2      NOT NULL DEFAULT GETDATE()
          )
        END
      `, { transaction });

      // 8. forms
      await sequelize.query(`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='forms')
        BEGIN
          CREATE TABLE [forms] (
            [id]          INT IDENTITY(1,1) PRIMARY KEY,
            [name]        NVARCHAR(255)  NOT NULL,
            [description] NVARCHAR(MAX),
            [type]        NVARCHAR(100),
            [info]        NVARCHAR(MAX),
            [data]        NVARCHAR(MAX)  NOT NULL,
            [status]      NVARCHAR(20)   NOT NULL DEFAULT 'active',
            [created_at]  DATETIME2      NOT NULL DEFAULT GETDATE(),
            [updated_at]  DATETIME2      NOT NULL DEFAULT GETDATE(),
            [deleted_at]  DATETIME2
          )
        END
      `, { transaction });

      // 9. surveys
      await sequelize.query(`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='surveys')
        BEGIN
          CREATE TABLE [surveys] (
            [id]          INT IDENTITY(1,1) PRIMARY KEY,
            [name]        NVARCHAR(255) NOT NULL,
            [type]        NVARCHAR(50)  NOT NULL,
            [date_from]   DATE          NOT NULL,
            [date_to]     DATE          NOT NULL,
            [form_ids]    NVARCHAR(MAX) NOT NULL DEFAULT '[]',
            [status]      BIT           NOT NULL DEFAULT 1,
            [description] NVARCHAR(MAX),
            [created_at]  DATETIME2     NOT NULL DEFAULT GETDATE(),
            [updated_at]  DATETIME2     NOT NULL DEFAULT GETDATE()
          )
        END
      `, { transaction });

      // 10. feedbacks
      await sequelize.query(`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='feedbacks')
        BEGIN
          CREATE TABLE [feedbacks] (
            [id]           INT IDENTITY(1,1) PRIMARY KEY,
            [form_id]      INT           NOT NULL,
            [creator_name] NVARCHAR(255) NOT NULL DEFAULT 'Người gửi ẩn danh',
            [status]       NVARCHAR(20)  NOT NULL DEFAULT 'pending',
            [info]         NVARCHAR(MAX),
            [type]         NVARCHAR(100),
            [user_id]      INT,
            [survey_key]   NVARCHAR(50),
            [created_at]   DATETIME2     NOT NULL DEFAULT GETDATE(),
            [updated_at]   DATETIME2     NOT NULL DEFAULT GETDATE()
          )
          CREATE INDEX idx_feedbacks_form_id    ON [feedbacks]([form_id])
          CREATE INDEX idx_feedbacks_survey_key ON [feedbacks]([survey_key])
          CREATE INDEX idx_feedbacks_type       ON [feedbacks]([type])
        END
      `, { transaction });

      // 11. feedback_sections
      await sequelize.query(`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='feedback_sections')
        BEGIN
          CREATE TABLE [feedback_sections] (
            [id]          INT IDENTITY(1,1) PRIMARY KEY,
            [feedback_id] INT           NOT NULL,
            [name]        NVARCHAR(255) NOT NULL,
            CONSTRAINT FK_fs_feedback FOREIGN KEY ([feedback_id])
              REFERENCES [feedbacks]([id]) ON DELETE CASCADE
          )
        END
      `, { transaction });

      // 12. feedback_options
      await sequelize.query(`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='feedback_options')
        BEGIN
          CREATE TABLE [feedback_options] (
            [id]                  INT IDENTITY(1,1) PRIMARY KEY,
            [feedback_section_id] INT           NOT NULL,
            [tiendo]              INT,
            [danhgia]             INT,
            [ghichu]              NVARCHAR(MAX),
            [data]                NVARCHAR(MAX),
            CONSTRAINT FK_fo_section FOREIGN KEY ([feedback_section_id])
              REFERENCES [feedback_sections]([id]) ON DELETE CASCADE
          )
        END
      `, { transaction });

      // 13. work_schedules
      await sequelize.query(`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='work_schedules')
        BEGIN
          CREATE TABLE [work_schedules] (
            [id]                BIGINT IDENTITY(1,1) PRIMARY KEY,
            [title]             NVARCHAR(255) NOT NULL,
            [content]           NVARCHAR(MAX),
            [start_time]        DATETIME2     NOT NULL,
            [end_time]          DATETIME2     NOT NULL,
            [location]          NVARCHAR(500),
            [coordinating_unit] NVARCHAR(255),
            [status]            NVARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
            [priority]          NVARCHAR(20)  NOT NULL DEFAULT 'NORMAL',
            [internal_notes]    NVARCHAR(MAX),
            [license_plate]     NVARCHAR(20),
            [created_by]        INT           NOT NULL,
            [approved_by]       INT,
            [presider_id]       INT,
            [created_at]        DATETIME2     NOT NULL DEFAULT GETDATE(),
            [updated_at]        DATETIME2     NOT NULL DEFAULT GETDATE()
          )
          CREATE INDEX idx_ws_start_time ON [work_schedules]([start_time])
          CREATE INDEX idx_ws_status     ON [work_schedules]([status])
        END
      `, { transaction });

      // 14. schedule_attachments
      await sequelize.query(`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='schedule_attachments')
        BEGIN
          CREATE TABLE [schedule_attachments] (
            [id]          BIGINT IDENTITY(1,1) PRIMARY KEY,
            [schedule_id] BIGINT        NOT NULL,
            [file_name]   NVARCHAR(255) NOT NULL,
            [file_path]   NVARCHAR(500) NOT NULL,
            [file_type]   NVARCHAR(50),
            [uploaded_at] DATETIME2     NOT NULL DEFAULT GETDATE(),
            CONSTRAINT FK_sa_schedule FOREIGN KEY ([schedule_id])
              REFERENCES [work_schedules]([id]) ON DELETE CASCADE
          )
        END
      `, { transaction });

      // 15. trading_facilities
      await sequelize.query(`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='trading_facilities')
        BEGIN
          CREATE TABLE [trading_facilities] (
            [id]                   INT IDENTITY(1,1) PRIMARY KEY,
            [certificate_number]   NVARCHAR(100),
            [name]                 NVARCHAR(MAX)  NOT NULL,
            [person_in_charge]     NVARCHAR(255),
            [practice_certificate] NVARCHAR(100),
            [facility_type]        NVARCHAR(100),
            [trading_type]         NVARCHAR(20)   NOT NULL,
            [address]              NVARCHAR(MAX),
            [issue_date]           NVARCHAR(30),
            [gps_number]           NVARCHAR(50),
            [gps_issue_date]       NVARCHAR(30),
            [is_active]            BIT            NOT NULL DEFAULT 1,
            [created_at]           DATETIME2      NOT NULL DEFAULT GETDATE(),
            [updated_at]           DATETIME2      NOT NULL DEFAULT GETDATE()
          )
        END
      `, { transaction });
    }

    console.log('      ✅ Initial schema created.');
  },

  async down(sequelize, transaction) {
    const pg = isPG(sequelize);
    // Xóa theo thứ tự ngược (child trước parent)
    const tables = [
      'trading_facilities', 'schedule_attachments', 'work_schedules',
      'feedback_options', 'feedback_sections', 'feedbacks',
      'surveys', 'forms', 'posts',
      'user_permissions', 'users',
      'affiliated_facilities', 'email_confirm', 'permissions', 'social_facilities',
    ];

    for (const t of tables) {
      if (pg) {
        await sequelize.query(`DROP TABLE IF EXISTS "${t}" CASCADE`, { transaction });
      } else {
        await sequelize.query(`
          IF OBJECT_ID('${t}','U') IS NOT NULL DROP TABLE [${t}]
        `, { transaction });
      }
    }
    console.log('      ✅ Rolled back: initial schema dropped.');
  },
};
