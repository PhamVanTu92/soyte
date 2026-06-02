/**
 * form-structure-seed.js
 *
 * Migrate dữ liệu từ forms.data (JSON blob) sang bảng chuẩn hóa:
 *   form_sections → form_questions → form_options
 *
 * Chạy: node src/seeders/form-structure-seed.js
 *
 * An toàn: bỏ qua form đã migrate (đã có sections trong bảng mới).
 */

'use strict';

require('dotenv').config();
process.env.DB_DIALECT = process.env.DB_DIALECT || 'postgres';

const db = require('../models');

/* ── Likert options mặc định (theo Bộ Y tế) ─────────────────── */
const DEFAULT_LIKERT_OPTIONS = [
  { value: '1', label: 'Rất không hài lòng',          order_index: 0 },
  { value: '2', label: 'Không hài lòng',               order_index: 1 },
  { value: '3', label: 'Bình thường',                   order_index: 2 },
  { value: '4', label: 'Hài lòng',                      order_index: 3 },
  { value: '5', label: 'Rất hài lòng',                  order_index: 4 },
  { value: '0', label: 'Không sử dụng / Không có ý kiến', order_index: 5 },
];

/* ── Parse cấu trúc từ form.data ────────────────────────────── */
function parseSections(rawData) {
  if (!rawData) return [];
  const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

  // Cấu trúc mới: { sections: [...] }
  if (data && Array.isArray(data.sections)) return data.sections;

  // Cấu trúc cũ: mảng sections trực tiếp
  if (Array.isArray(data)) return data;

  // Cấu trúc cũ khác: { data: [...] }
  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function mapQuestionType(raw) {
  const t = (raw || '').toLowerCase();
  if (['likert', 'single', 'multi', 'text', 'textarea', 'number', 'date'].includes(t)) return t;
  if (t === 'radio') return 'single';
  if (t === 'checkbox') return 'multi';
  return 'text';
}

/* ── Main ────────────────────────────────────────────────────── */
async function main() {
  try {
    await db.sequelize.authenticate();
    console.log('[seed] DB connected');

    const forms = await db.Form.findAll({ paranoid: false });
    console.log(`[seed] Found ${forms.length} forms`);

    let migrated = 0;
    let skipped  = 0;

    for (const form of forms) {
      // Kiểm tra đã migrate chưa
      const existing = await db.FormSection.count({ where: { form_id: form.id } });
      if (existing > 0) {
        skipped++;
        continue;
      }

      const rawData = form.getDataValue('data');
      const sections = parseSections(rawData);

      if (!sections || sections.length === 0) {
        console.log(`  [skip] Form #${form.id} "${form.name}" — no sections in data`);
        skipped++;
        continue;
      }

      const transaction = await db.sequelize.transaction();
      try {
        for (let si = 0; si < sections.length; si++) {
          const sec = sections[si];
          const secTitle = sec.title || sec.name || `Phần ${si + 1}`;

          const createdSec = await db.FormSection.create(
            { form_id: form.id, title: secTitle, order_index: si },
            { transaction },
          );

          const questions = sec.questions || sec.fields || [];
          for (let qi = 0; qi < questions.length; qi++) {
            const q = questions[qi];
            const qKey   = q.id || q.question_key || q.key || `q${qi + 1}`;
            const qType  = mapQuestionType(q.type);
            const qLabel = q.label || q.name || q.title || '';

            const createdQ = await db.FormQuestion.create(
              {
                section_id:   createdSec.id,
                question_key: String(qKey),
                type:         qType,
                label:        qLabel,
                required:     Boolean(q.required),
                order_index:  q.order_index ?? qi,
                score_weight: parseFloat(q.score_weight ?? 1.0),
              },
              { transaction },
            );

            // Options
            let options = q.options || [];
            if (qType === 'likert' && options.length === 0) {
              options = DEFAULT_LIKERT_OPTIONS.map((o) => ({ ...o, value: o.value }));
            }

            if (options.length > 0) {
              const rows = options.map((opt, oi) => ({
                question_id: createdQ.id,
                option_key:  String(opt.value ?? opt.option_key ?? oi + 1),
                label:       opt.label || '',
                order_index: opt.order_index ?? oi,
              }));
              await db.FormOption.bulkCreate(rows, {
                transaction,
                ignoreDuplicates: true,
              });
            }
          }
        }

        await transaction.commit();
        console.log(`  [ok]   Form #${form.id} "${form.name}" → ${sections.length} sections`);
        migrated++;
      } catch (err) {
        await transaction.rollback();
        console.error(`  [err]  Form #${form.id} "${form.name}": ${err.message}`);
      }
    }

    console.log(`\n[seed] Done. Migrated: ${migrated} | Skipped: ${skipped}`);
  } catch (err) {
    console.error('[seed] Fatal:', err.message);
    process.exit(1);
  } finally {
    await db.sequelize.close();
  }
}

main();
