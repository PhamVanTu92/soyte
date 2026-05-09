'use strict';

const isPG = (seq) => (seq.options.dialect || '') === 'postgres';

module.exports = {
  async up(sequelize, transaction) {
    if (!isPG(sequelize)) {
      console.log('      ⚠️  Dataset module chỉ hỗ trợ PostgreSQL. Bỏ qua.');
      return;
    }

    // ── Bảng dataset_types ────────────────────────────────────────
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "dataset_types" (
        "id"          SERIAL PRIMARY KEY,
        "code"        VARCHAR(100) UNIQUE NOT NULL,
        "name"        TEXT NOT NULL,
        "description" TEXT,
        "fields"      JSONB,
        "source_file" TEXT,
        "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `, { transaction });

    // ── Bảng dataset_records ──────────────────────────────────────
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "dataset_records" (
        "id"              BIGSERIAL PRIMARY KEY,
        "dataset_type_id" INTEGER NOT NULL
          REFERENCES "dataset_types"("id") ON DELETE CASCADE,
        "data"            JSONB NOT NULL,
        "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `, { transaction });

    // ── Indexes (dùng DO...EXCEPTION để idempotent hoàn toàn) ─────
    await sequelize.query(`
      DO $$ BEGIN
        CREATE INDEX idx_dataset_records_gin
          ON "dataset_records" USING GIN ("data");
      EXCEPTION WHEN duplicate_table THEN NULL;
      END $$
    `, { transaction });

    await sequelize.query(`
      DO $$ BEGIN
        CREATE INDEX idx_dataset_records_type
          ON "dataset_records" ("dataset_type_id");
      EXCEPTION WHEN duplicate_table THEN NULL;
      END $$
    `, { transaction });

    await sequelize.query(`
      DO $$ BEGIN
        CREATE INDEX idx_dataset_records_type_created
          ON "dataset_records" ("dataset_type_id", "created_at" DESC);
      EXCEPTION WHEN duplicate_table THEN NULL;
      END $$
    `, { transaction });

    // ── Trigger updated_at ────────────────────────────────────────
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION fn_dataset_updated_at()
      RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $$
    `, { transaction });

    await sequelize.query(`
      DO $$ BEGIN
        CREATE TRIGGER trg_dataset_types_upd
          BEFORE UPDATE ON "dataset_types"
          FOR EACH ROW EXECUTE FUNCTION fn_dataset_updated_at();
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `, { transaction });

    await sequelize.query(`
      DO $$ BEGIN
        CREATE TRIGGER trg_dataset_records_upd
          BEFORE UPDATE ON "dataset_records"
          FOR EACH ROW EXECUTE FUNCTION fn_dataset_updated_at();
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `, { transaction });

    console.log('      ✅ Tạo dataset_types, dataset_records tables + indexes + triggers.');
  },

  async down(sequelize, transaction) {
    await sequelize.query(`DROP TABLE IF EXISTS "dataset_records"`, { transaction });
    await sequelize.query(`DROP TABLE IF EXISTS "dataset_types"`,   { transaction });
    console.log('      ✅ Dropped dataset_types, dataset_records.');
  },
};
