'use strict';

/**
 * Migration: seed_trading_facilities
 * Seed 6946 cơ sở bán buôn + bán lẻ từ file Excel
 */

const path = require('path');
const isPG = (seq) => (seq.options.dialect || '') === 'postgres';

module.exports = {
  async up(sequelize, transaction) {
    const data = require(path.join(__dirname, 'trading_facilities_seed.json'));

    const BATCH = 200;
    for (let i = 0; i < data.length; i += BATCH) {
      const batch = data.slice(i, i + BATCH);

      if (isPG(sequelize)) {
        const vals = batch.map((r, idx) => {
          const base = idx * 10;
          return `(:cert_${base},:name_${base},:pic_${base},:pc_${base},:ft_${base},:tt_${base},:addr_${base},:id_${base},:gps_${base},:gid_${base})`;
        }).join(',');

        const replacements = {};
        batch.forEach((r, idx) => {
          const base = idx * 10;
          replacements[`cert_${base}`] = r.certificate_number;
          replacements[`name_${base}`] = r.name;
          replacements[`pic_${base}`]  = r.person_in_charge;
          replacements[`pc_${base}`]   = r.practice_certificate;
          replacements[`ft_${base}`]   = r.facility_type;
          replacements[`tt_${base}`]   = r.trading_type;
          replacements[`addr_${base}`] = r.address;
          replacements[`id_${base}`]   = r.issue_date;
          replacements[`gps_${base}`]  = r.gps_number;
          replacements[`gid_${base}`]  = r.gps_issue_date;
        });

        await sequelize.query(`
          INSERT INTO "trading_facilities"
            ("certificate_number","name","person_in_charge","practice_certificate",
             "facility_type","trading_type","address","issue_date","gps_number","gps_issue_date")
          VALUES ${vals}
          ON CONFLICT DO NOTHING
        `, { replacements, transaction });

      } else {
        for (const r of batch) {
          const esc = (v) => v ? `N'${String(v).replace(/'/g, "''")}'` : 'NULL';
          await sequelize.query(`
            IF NOT EXISTS (SELECT 1 FROM [trading_facilities] WHERE [certificate_number] = ${esc(r.certificate_number)} AND [name] = ${esc(r.name)})
              INSERT INTO [trading_facilities]
                ([certificate_number],[name],[person_in_charge],[practice_certificate],
                 [facility_type],[trading_type],[address],[issue_date],[gps_number],[gps_issue_date])
              VALUES (${esc(r.certificate_number)},${esc(r.name)},${esc(r.person_in_charge)},${esc(r.practice_certificate)},
                      ${esc(r.facility_type)},N'${r.trading_type}',${esc(r.address)},${esc(r.issue_date)},${esc(r.gps_number)},${esc(r.gps_issue_date)})
          `, { transaction });
        }
      }

      process.stdout.write(`\r  seeded ${Math.min(i + BATCH, data.length)}/${data.length}`);
    }
    process.stdout.write('\n');
  },

  async down(sequelize, transaction) {
    if (isPG(sequelize)) {
      await sequelize.query(`DELETE FROM "trading_facilities"`, { transaction });
    } else {
      await sequelize.query(`DELETE FROM [trading_facilities]`, { transaction });
    }
  },
};
