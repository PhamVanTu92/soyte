/**
 * survey-facilities-seed.js
 * Seed bảng survey_facilities từ dữ liệu phản hồi (feedbacks) hiện có.
 *
 * Logic:
 *   1. Quét toàn bộ feedbacks có survey_key + info
 *   2. Parse info → tìm facility_id (số nguyên, khớp với social_facilities.id)
 *   3. Với mỗi cặp (survey_key, facility_id) duy nhất → insert vào survey_facilities
 *
 * Chạy: node src/seeders/survey-facilities-seed.js
 * Hoặc tích hợp vào migration runner bằng cách import hàm run() trực tiếp.
 */

require('dotenv').config();
const db = require('../models');

// ─── helper: trích facility_id từ info JSON ──────────────────────────────────

function extractFacilityId(info) {
  if (!info) return null;
  let data = info;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch (_) { return null; }
  }

  const tryNumeric = (val) => {
    if (val === null || val === undefined) return null;
    const n = Number(val);
    return (!isNaN(n) && n > 0) ? n : null;
  };

  if (Array.isArray(data)) {
    const unitItem = data.find(i => {
      const label = ((i.name || '') + (i.label || '')).toLowerCase();
      return label.includes('đơn vị') || label === 'unit';
    });
    if (unitItem?.value) {
      if (typeof unitItem.value === 'object') return tryNumeric(unitItem.value.key);
      return tryNumeric(unitItem.value);
    }
    return null;
  }

  if (typeof data === 'object') {
    for (const k in data) {
      if (k === 'title' || k === 'description') continue;
      const item = data[k];
      if (!item?.value) continue;
      const candidate =
        (typeof item.value === 'object' && item.value !== null)
          ? tryNumeric(item.value.key)
          : tryNumeric(item.value);
      if (candidate) return candidate;
    }
  }

  return null;
}

// ─── main ────────────────────────────────────────────────────────────────────

async function run() {
  try {
    await db.sequelize.authenticate();
    console.log('[seed] DB connected');

    // Lấy toàn bộ social_facility IDs hợp lệ
    const facilities = await db.SocialFacility.findAll({ attributes: ['id'] });
    const validFacilityIds = new Set(facilities.map(f => f.id));
    console.log(`[seed] Valid facilities: ${validFacilityIds.size}`);

    // Lấy toàn bộ surveys hợp lệ
    const surveys = await db.Survey.findAll({ attributes: ['id'] });
    const validSurveyIds = new Set(surveys.map(s => String(s.id)));
    console.log(`[seed] Valid surveys: ${validSurveyIds.size}`);

    // Quét feedbacks theo batch (tránh OOM với data lớn)
    const BATCH_SIZE = 500;
    let offset = 0;
    const pairs = new Map(); // key: "surveyId-facilityId"

    while (true) {
      const rows = await db.Feedback.findAll({
        where: { survey_key: { [db.Sequelize.Op.ne]: null } },
        attributes: ['survey_key', 'info'],
        limit: BATCH_SIZE,
        offset,
        order: [['id', 'ASC']],
      });

      if (rows.length === 0) break;

      for (const row of rows) {
        const surveyKey = String(row.survey_key).trim();
        if (!validSurveyIds.has(surveyKey)) continue;

        let info = row.info;
        if (typeof info === 'string') {
          try { info = JSON.parse(info); } catch (_) { info = null; }
        }

        const facilityId = extractFacilityId(info);
        if (!facilityId || !validFacilityIds.has(facilityId)) continue;

        const pairKey = `${surveyKey}-${facilityId}`;
        if (!pairs.has(pairKey)) {
          pairs.set(pairKey, { survey_id: Number(surveyKey), facility_id: facilityId });
        }
      }

      offset += rows.length;
      process.stdout.write(`\r[seed] Scanned ${offset} feedbacks, found ${pairs.size} pairs`);
      if (rows.length < BATCH_SIZE) break;
    }

    console.log(`\n[seed] Unique (survey, facility) pairs to insert: ${pairs.size}`);

    if (pairs.size === 0) {
      console.log('[seed] Nothing to insert. Done.');
      return;
    }

    // Bulk insert — ignoreDuplicates để idempotent
    const records = Array.from(pairs.values());
    const CHUNK = 200;
    let inserted = 0;
    for (let i = 0; i < records.length; i += CHUNK) {
      await db.SurveyFacility.bulkCreate(records.slice(i, i + CHUNK), { ignoreDuplicates: true });
      inserted += Math.min(CHUNK, records.length - i);
      process.stdout.write(`\r[seed] Inserted ${inserted}/${records.length}`);
    }
    console.log('\n[seed] Done!');
  } catch (err) {
    console.error('[seed] Error:', err.message);
    process.exit(1);
  } finally {
    await db.sequelize.close();
  }
}

run();
