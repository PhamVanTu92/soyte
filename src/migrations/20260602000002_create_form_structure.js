/**
 * Migration: Chuẩn hóa cấu trúc biểu mẫu
 *
 * Thêm vào bảng forms : org, badge
 * Tạo mới               : form_sections, form_questions, form_options
 *
 * form_sections  – nhóm câu hỏi (Section A, B, C …)
 * form_questions – câu hỏi (question_key: A1, B2 …  type: likert|single|multi|text|…)
 * form_options   – đáp án cho single/multi/likert
 */

'use strict';

const isPG = (seq) => seq.getDialect() === 'postgres';

module.exports = {
  async up(sequelize, transaction) {
    if (!isPG(sequelize)) return; // chỉ hỗ trợ PostgreSQL

    /* ── 1. Thêm cột org, badge vào forms ──────────────────────── */
    await sequelize.query(`
      ALTER TABLE "forms"
        ADD COLUMN IF NOT EXISTS "org"   VARCHAR(255) NULL,
        ADD COLUMN IF NOT EXISTS "badge" VARCHAR(100) NULL;
    `, { transaction });

    /* ── 2. form_sections ────────────────────────────────────────── */
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "form_sections" (
        "id"          SERIAL       NOT NULL,
        "form_id"     INTEGER      NOT NULL,
        "title"       VARCHAR(500) NOT NULL DEFAULT '',
        "order_index" INTEGER      NOT NULL DEFAULT 0,
        "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        "updated_at"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        PRIMARY KEY ("id"),
        CONSTRAINT "fk_fs_form"
          FOREIGN KEY ("form_id") REFERENCES "forms"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      );
    `, { transaction });

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_form_sections_form_id"
        ON "form_sections"("form_id");
    `, { transaction });

    /* ── 3. form_questions ───────────────────────────────────────── */
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "form_questions" (
        "id"           SERIAL        NOT NULL,
        "section_id"   INTEGER       NOT NULL,
        "question_key" VARCHAR(100)  NOT NULL,
        "type"         VARCHAR(50)   NOT NULL DEFAULT 'text',
        "label"        TEXT          NOT NULL DEFAULT '',
        "required"     BOOLEAN       NOT NULL DEFAULT false,
        "order_index"  INTEGER       NOT NULL DEFAULT 0,
        "score_weight" DECIMAL(5,2)  NOT NULL DEFAULT 1.00,
        "created_at"   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "updated_at"   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        PRIMARY KEY ("id"),
        CONSTRAINT "fk_fq_section"
          FOREIGN KEY ("section_id") REFERENCES "form_sections"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      );
    `, { transaction });

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_form_questions_section_id"
        ON "form_questions"("section_id");
      CREATE INDEX IF NOT EXISTS "idx_form_questions_key"
        ON "form_questions"("question_key");
      CREATE INDEX IF NOT EXISTS "idx_form_questions_type"
        ON "form_questions"("type");
    `, { transaction });

    /* ── 4. form_options ─────────────────────────────────────────── */
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "form_options" (
        "id"          SERIAL       NOT NULL,
        "question_id" INTEGER      NOT NULL,
        "option_key"  VARCHAR(50)  NOT NULL,
        "label"       TEXT         NOT NULL DEFAULT '',
        "order_index" INTEGER      NOT NULL DEFAULT 0,
        PRIMARY KEY ("id"),
        CONSTRAINT "fk_fo_question"
          FOREIGN KEY ("question_id") REFERENCES "form_questions"("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "uq_fo_question_key" UNIQUE ("question_id", "option_key")
      );
    `, { transaction });

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_form_options_question_id"
        ON "form_options"("question_id");
    `, { transaction });
  },

  async down(sequelize, transaction) {
    if (!isPG(sequelize)) return;
    await sequelize.query(`DROP TABLE IF EXISTS "form_options";`,   { transaction });
    await sequelize.query(`DROP TABLE IF EXISTS "form_questions";`, { transaction });
    await sequelize.query(`DROP TABLE IF EXISTS "form_sections";`,  { transaction });
    await sequelize.query(`
      ALTER TABLE "forms"
        DROP COLUMN IF EXISTS "org",
        DROP COLUMN IF EXISTS "badge";
    `, { transaction });
  },
};
