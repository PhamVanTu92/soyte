/**
 * add-info-sections.js
 *
 * Thêm sections "Thông tin chung" và "Thông tin người bệnh/trả lời"
 * vào đầu các form preset đã tồn tại trong DB.
 *
 * An toàn: chỉ thêm nếu chưa có section thông tin chung.
 * Chạy: node src/seeders/add-info-sections.js
 */

'use strict';
require('dotenv').config();
process.env.DB_DIALECT = process.env.DB_DIALECT || 'postgres';
const db = require('../models');

/* ── helpers ─────────────────────────────────────────────────── */
const sq = (key, label, opts, required = true) => ({
  question_key: key, type: 'single', label, required,
  score_weight: 1.0, options: opts.map((o, i) => ({ option_key: String(i + 1), label: o, order_index: i })),
});
const tx = (key, label, required = false) => ({
  question_key: key, type: 'text', label, required, score_weight: 1.0, options: [],
});
const dt = (key, label) => ({
  question_key: key, type: 'date', label, required: false, score_weight: 1.0, options: [],
});
const nm = (key, label, required = false) => ({
  question_key: key, type: 'number', label, required, score_weight: 1.0, options: [],
});

const NGUOI_DIEN_OPTS_HOSPITAL = [
  'Người bệnh tự điền (hoặc người nhà)',
  'Nhân viên của bệnh viện',
  'Bộ Y tế, Sở Y tế hoặc đoàn giám sát của cơ quan quản lý',
  'Tổ chức độc lập',
  'Đối tượng khác',
];
const NGUOI_DIEN_OPTS_VACCINE = [
  'Người được tiêm chủng tự điền (hoặc người nhà)',
  'Đoàn giám sát của cơ quan quản lý',
  'Tổ chức độc lập',
  'Nhân viên của Trạm Y tế',
];
const NOI_SONG_OPTS    = ['Thành thị', 'Nông thôn', 'Vùng sâu, xa khó khăn'];
const MUC_SONG_OPTS    = ['Nghèo', 'Cận nghèo', 'Khác'];
const GIOI_TINH_OPTS   = ['Nam', 'Nữ', 'Khác'];
const BHYT_OPTS        = ['Có', 'Không'];

/* ── Section definitions ────────────────────────────────────── */

/** Mẫu 1 (Nội trú) — Thông tin chung */
const THONG_TIN_CHUNG_NOI_TRU = {
  title: 'Thông tin chung',
  questions: [
    tx  ('ma_bv',         'Tên / Mã bệnh viện'),
    dt  ('ngay_dien',     'Ngày điền phiếu'),
    sq  ('nguoi_dien',    'Người phỏng vấn / điền phiếu', NGUOI_DIEN_OPTS_HOSPITAL),
    sq  ('nguoi_tra_loi', 'Người trả lời là', ['Người bệnh', 'Người nhà']),
    tx  ('ten_khoa',      'Tên khoa nằm điều trị trước ra viện'),
  ].map((q, i) => ({ ...q, order_index: i })),
};
const THONG_TIN_NGUOI_BENH_NOI_TRU = {
  title: 'Thông tin người bệnh',
  questions: [
    sq  ('A1_gioi',   'A1. Giới tính',                                                GIOI_TINH_OPTS, true),
    nm  ('A2_tuoi',   'A2. Tuổi (hoặc năm sinh)', false),
    tx  ('A3_dt',     'A3. Số di động liên hệ'),
    nm  ('A4_songay', 'A4. Số ngày đã nằm viện', false),
    sq  ('A5_bhyt',   'A5. Ông/Bà có sử dụng thẻ BHYT cho lần điều trị này không?',  BHYT_OPTS, true),
    sq  ('A6_noisong','A6. Nơi sinh sống hiện nay',                                   NOI_SONG_OPTS, true),
    sq  ('A7_mucsong','A7. Phân loại mức sống của gia đình',                          MUC_SONG_OPTS, true),
    nm  ('A8_lanthu', 'A8. Đây là lần điều trị thứ mấy của Ông/Bà tại bệnh viện?', false),
  ].map((q, i) => ({ ...q, order_index: i })),
};

/** Mẫu 2 (Ngoại trú) — Thông tin chung */
const THONG_TIN_CHUNG_NGOAI_TRU = {
  title: 'Thông tin chung',
  questions: [
    tx  ('ma_bv',         'Tên / Mã bệnh viện'),
    dt  ('ngay_dien',     'Ngày điền phiếu'),
    sq  ('nguoi_dien',    'Người phỏng vấn / điền phiếu', NGUOI_DIEN_OPTS_HOSPITAL),
    sq  ('nguoi_tra_loi', 'Người trả lời là', ['Người bệnh', 'Người nhà']),
  ].map((q, i) => ({ ...q, order_index: i })),
};
const THONG_TIN_NGUOI_BENH_NGOAI_TRU = {
  title: 'Thông tin người bệnh',
  questions: [
    sq  ('A1_gioi',       'A1. Giới tính',                                               GIOI_TINH_OPTS, true),
    nm  ('A2_tuoi',       'A2. Tuổi (hoặc năm sinh)', false),
    tx  ('A3_dt',         'A3. Số di động liên hệ'),
    nm  ('A4_khoangcach', 'A4. Ước tính khoảng cách từ nơi sinh sống đến bệnh viện (km)', false),
    sq  ('A5_bhyt',       'A5. Ông/Bà có sử dụng thẻ BHYT cho lần khám này không?',     BHYT_OPTS, true),
    sq  ('A6_noisong',    'A6. Nơi sinh sống hiện nay',                                  NOI_SONG_OPTS, true),
    sq  ('A7_mucsong',    'A7. Phân loại mức sống của gia đình',                         MUC_SONG_OPTS, true),
    nm  ('A8_lanthu',     'A8. Đây là lần khám thứ mấy của Ông/Bà tại bệnh viện?', false),
  ].map((q, i) => ({ ...q, order_index: i })),
};

/** Mẫu 3 (Tiêm chủng) — Thông tin chung + Thông tin người trả lời */
const THONG_TIN_CHUNG_VACCINE = {
  title: 'Thông tin chung',
  questions: [
    tx  ('ten_tyt',       'Tên Trạm Y tế'),
    dt  ('ngay_dien',     'Ngày điền phiếu'),
    sq  ('nguoi_dien',    'Người phỏng vấn / điền phiếu', NGUOI_DIEN_OPTS_VACCINE),
  ].map((q, i) => ({ ...q, order_index: i })),
};
const THONG_TIN_NGUOI_TRA_LOI_VACCINE = {
  title: 'I. Thông tin của người trả lời',
  questions: [
    sq  ('A1',  'A1. Giới tính',                                                    GIOI_TINH_OPTS, true),
    nm  ('A2',  'A2. Tuổi (hoặc năm sinh)', false),
    tx  ('A3',  'A3. Số di động liên hệ'),
    sq  ('A4',  'A4. Người được tiêm chủng là',
      ['Trẻ em', 'Phụ nữ mang thai'], true),
    sq  ('A5',  'A5. Người trả lời là',
      ['Người được tiêm chủng', 'Người nhà của người được tiêm chủng'], true),
    sq  ('A6',  'A6. Nơi sinh sống hiện nay',                                       NOI_SONG_OPTS, true),
    sq  ('A7',  'A7. Phân loại mức sống của gia đình',                              MUC_SONG_OPTS, true),
  ].map((q, i) => ({ ...q, order_index: i })),
};

/* ── Prepend sections to a form ─────────────────────────────── */
async function prependSections(formId, newSections, transaction) {
  // Shift existing sections
  const shift = newSections.length;
  await db.FormSection.increment('order_index', {
    by: shift,
    where: { form_id: formId },
    transaction,
  });

  for (let si = 0; si < newSections.length; si++) {
    const secDef = newSections[si];
    const sec = await db.FormSection.create(
      { form_id: formId, title: secDef.title, order_index: si },
      { transaction },
    );
    for (const q of secDef.questions) {
      const { options, ...qMeta } = q;
      const createdQ = await db.FormQuestion.create(
        { section_id: sec.id, ...qMeta },
        { transaction },
      );
      if (options && options.length > 0) {
        await db.FormOption.bulkCreate(
          options.map(o => ({ question_id: createdQ.id, ...o })),
          { transaction, ignoreDuplicates: true },
        );
      }
    }
  }
}

/* ── Main ────────────────────────────────────────────────────── */
async function main() {
  await db.sequelize.authenticate();
  console.log('[seed] DB connected');

  const TARGETS = [
    {
      badge: 'MẪU SỐ 1',
      markerTitle: 'Thông tin chung',
      sectionsToAdd: [THONG_TIN_CHUNG_NOI_TRU, THONG_TIN_NGUOI_BENH_NOI_TRU],
    },
    {
      badge: 'MẪU SỐ 2',
      markerTitle: 'Thông tin chung',
      sectionsToAdd: [THONG_TIN_CHUNG_NGOAI_TRU, THONG_TIN_NGUOI_BENH_NGOAI_TRU],
    },
    {
      badge: 'MẪU SỐ 3',
      markerTitle: 'Thông tin chung',
      sectionsToAdd: [THONG_TIN_CHUNG_VACCINE, THONG_TIN_NGUOI_TRA_LOI_VACCINE],
    },
  ];

  for (const target of TARGETS) {
    const form = await db.Form.findOne({ where: { badge: target.badge } });
    if (!form) {
      console.log(`  [skip] Badge "${target.badge}" không tìm thấy`);
      continue;
    }

    // Kiểm tra đã có section thông tin chung chưa
    const existing = await db.FormSection.findOne({
      where: { form_id: form.id, title: target.markerTitle },
    });
    if (existing) {
      console.log(`  [skip] Form "${form.name}" đã có "${target.markerTitle}"`);
      continue;
    }

    const t = await db.sequelize.transaction();
    try {
      await prependSections(form.id, target.sectionsToAdd, t);
      await t.commit();
      const qCount = target.sectionsToAdd.reduce((a, s) => a + s.questions.length, 0);
      console.log(`  [ok]   "${form.name}" — thêm ${target.sectionsToAdd.length} section, ${qCount} câu hỏi`);
    } catch (err) {
      await t.rollback();
      console.error(`  [err]  "${form.name}": ${err.message}`);
    }
  }

  console.log('\n[seed] Hoàn thành');
  await db.sequelize.close();
}

main().catch(err => { console.error(err); process.exit(1); });
