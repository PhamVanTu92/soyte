'use strict';
/**
 * form_new.service.js
 *
 * Quản lý biểu mẫu chuẩn hóa:
 *   forms → form_sections → form_questions → form_options
 *
 * Không chỉnh sửa code cũ (form.service.js).
 */

const db = require('../models');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');

/* ── Helpers ─────────────────────────────────────────────────── */

/** Include đầy đủ sections → questions → options (có order) */
const FULL_INCLUDE = [
  {
    model: db.FormSection,
    as: 'sections',
    attributes: ['id', 'title', 'order_index'],
    order: [['order_index', 'ASC']],
    include: [
      {
        model: db.FormQuestion,
        as: 'questions',
        attributes: [
          'id', 'question_key', 'type', 'label',
          'required', 'order_index', 'score_weight',
        ],
        include: [
          {
            model: db.FormOption,
            as: 'options',
            attributes: ['id', 'option_key', 'label', 'order_index'],
          },
        ],
      },
    ],
  },
];

/**
 * Xoá và tạo lại toàn bộ sections/questions/options của 1 form.
 * Dùng trong cả create lẫn update (full replace).
 */
const replaceSections = async (formId, sections = [], transaction) => {
  // 1. Xoá cũ (cascade → questions → options)
  await db.FormSection.destroy({ where: { form_id: formId }, transaction });

  if (!Array.isArray(sections) || sections.length === 0) return;

  // 2. Tạo mới
  for (let si = 0; si < sections.length; si++) {
    const sec = sections[si];
    const createdSec = await db.FormSection.create(
      {
        form_id: formId,
        title: sec.title || '',
        order_index: sec.order_index ?? si,
      },
      { transaction },
    );

    const questions = sec.questions || [];
    for (let qi = 0; qi < questions.length; qi++) {
      const q = questions[qi];
      const createdQ = await db.FormQuestion.create(
        {
          section_id: createdSec.id,
          question_key: q.question_key || q.id || `q${qi + 1}`,
          type: q.type || 'text',
          label: q.label || '',
          required: Boolean(q.required),
          order_index: q.order_index ?? qi,
          score_weight: parseFloat(q.score_weight ?? 1.0),
        },
        { transaction },
      );

      const options = q.options || [];
      if (options.length > 0) {
        await db.FormOption.bulkCreate(
          options.map((opt, oi) => ({
            question_id: createdQ.id,
            option_key: String(opt.value ?? opt.option_key ?? oi + 1),
            label: opt.label || '',
            order_index: opt.order_index ?? oi,
          })),
          { transaction, ignoreDuplicates: true },
        );
      }
    }
  }
};

/* ── Service functions ───────────────────────────────────────── */

/**
 * Danh sách biểu mẫu (không include cấu trúc, để nhẹ)
 * Trả thêm question_count và section_count qua sub-query
 */
const getForms = async (queryOptions = {}) => {
  const page  = Math.max(1, parseInt(queryOptions.page,  10) || 1);
  const limit = Math.min(200, parseInt(queryOptions.limit, 10) || 10);
  const { search, status, type } = queryOptions;
  const offset = (page - 1) * limit;

  const where = {};
  if (search) where.name = { [Op.iLike]: `%${search}%` };
  if (status) where.status = status;
  if (type)   where.type = type;

  const { count, rows } = await db.Form.findAndCountAll({
    where,
    offset,
    limit,
    order: [['created_at', 'DESC']],
    attributes: [
      'id', 'name', 'description', 'org', 'badge', 'type', 'status',
      'created_at', 'updated_at',
    ],
    include: [
      {
        model: db.FormSection,
        as: 'sections',
        attributes: ['id'],
        include: [
          {
            model: db.FormQuestion,
            as: 'questions',
            attributes: ['id', 'type'],
          },
        ],
      },
    ],
  });

  const items = rows.map((f) => {
    const plain = f.get({ plain: true });
    const sectionCount = plain.sections?.length ?? 0;
    const questionCount = plain.sections?.reduce(
      (acc, s) => acc + (s.questions?.length ?? 0), 0,
    ) ?? 0;
    const likertCount = plain.sections?.reduce(
      (acc, s) => acc + (s.questions?.filter((q) => q.type === 'likert')?.length ?? 0), 0,
    ) ?? 0;
    delete plain.sections;
    return { ...plain, section_count: sectionCount, question_count: questionCount, likert_count: likertCount };
  });

  return { items, total: count, page, limit };
};

/**
 * Lấy biểu mẫu đầy đủ (sections → questions → options)
 */
const getFormById = async (id) => {
  const form = await db.Form.findByPk(id, {
    attributes: [
      'id', 'name', 'description', 'org', 'badge',
      'type', 'status', 'created_at', 'updated_at',
    ],
    include: FULL_INCLUDE,
    order: [
      [{ model: db.FormSection, as: 'sections' }, 'order_index', 'ASC'],
      [{ model: db.FormSection, as: 'sections' },
       { model: db.FormQuestion, as: 'questions' }, 'order_index', 'ASC'],
      [{ model: db.FormSection, as: 'sections' },
       { model: db.FormQuestion, as: 'questions' },
       { model: db.FormOption, as: 'options' }, 'order_index', 'ASC'],
    ],
  });
  if (!form) throw new ApiError(404, 'Biểu mẫu không tồn tại');
  return form;
};

/**
 * Tạo biểu mẫu cùng toàn bộ cấu trúc trong 1 transaction
 */
const createForm = async (data) => {
  const { sections, ...formData } = data;

  const transaction = await db.sequelize.transaction();
  try {
    const form = await db.Form.create(
      {
        name:        formData.name,
        description: formData.description || null,
        org:         formData.org   || null,
        badge:       formData.badge || null,
        type:        formData.type  || null,
        status:      formData.status || 'active',
        info:        formData.info  || null,
        data:        formData.data  || '{}', // giữ tương thích cột cũ
      },
      { transaction },
    );

    await replaceSections(form.id, sections, transaction);
    await transaction.commit();
    return getFormById(form.id);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/**
 * Cập nhật biểu mẫu. Nếu body có "sections" → thay toàn bộ cấu trúc.
 */
const updateForm = async (id, data) => {
  const { sections, ...formData } = data;

  const form = await db.Form.findByPk(id);
  if (!form) throw new ApiError(404, 'Biểu mẫu không tồn tại');

  const transaction = await db.sequelize.transaction();
  try {
    const updateFields = {};
    if (formData.name        !== undefined) updateFields.name        = formData.name;
    if (formData.description !== undefined) updateFields.description = formData.description;
    if (formData.org         !== undefined) updateFields.org         = formData.org;
    if (formData.badge       !== undefined) updateFields.badge       = formData.badge;
    if (formData.type        !== undefined) updateFields.type        = formData.type;
    if (formData.status      !== undefined) updateFields.status      = formData.status;
    if (formData.info        !== undefined) updateFields.info        = formData.info;

    await form.update(updateFields, { transaction });

    // Cập nhật cấu trúc nếu client gửi sections (dù rỗng)
    if (sections !== undefined) {
      await replaceSections(id, sections, transaction);
    }

    await transaction.commit();
    return getFormById(id);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/**
 * Soft-delete — chỉ cho phép nếu biểu mẫu không thuộc cuộc khảo sát nào
 */
const deleteForm = async (id) => {
  const form = await db.Form.findByPk(id);
  if (!form) throw new ApiError(404, 'Biểu mẫu không tồn tại');

  // Kiểm tra form có đang được dùng trong survey nào không
  const usedInSurvey = await db.Survey.findOne({
    where: db.sequelize.literal(`form_ids LIKE '%${Number(id)}%'`),
    attributes: ['id', 'name'],
  });
  if (usedInSurvey) {
    throw new ApiError(
      400,
      `Không thể xóa — biểu mẫu đang được sử dụng trong cuộc khảo sát "${usedInSurvey.name}". Hãy gỡ biểu mẫu khỏi khảo sát trước.`,
    );
  }

  await form.destroy();
  return { id };
};

/**
 * Thống kê câu hỏi từ dữ liệu feedback thực
 *
 * Trả về: mỗi câu hỏi Likert → { avg, distribution[0..5], satisfied_rate }
 * Mỗi câu hỏi Single/Multi → { distribution by option_key }
 */
const getFormStats = async (formId, queryOptions = {}) => {
  const form = await getFormById(formId);
  if (!form) throw new ApiError(404, 'Biểu mẫu không tồn tại');

  // Lấy tất cả feedbacks liên kết với form này
  const feedbacks = await db.Feedback.findAll({
    where: { form_id: formId },
    include: [
      {
        model: db.FeedbackSection,
        as: 'sections',
        attributes: ['id', 'title', 'data'],
      },
    ],
    attributes: ['id', 'created_at'],
    ...(queryOptions.from || queryOptions.to
      ? {
          where: {
            form_id: formId,
            ...(queryOptions.from ? { created_at: { [Op.gte]: new Date(queryOptions.from) } } : {}),
            ...(queryOptions.to   ? { created_at: { [Op.lte]: new Date(queryOptions.to)   } } : {}),
          },
        }
      : {}),
  });

  const totalFeedbacks = feedbacks.length;

  // Build answers map: { question_key → [value, ...] }
  const answersMap = {};
  for (const fb of feedbacks) {
    for (const sec of (fb.sections || [])) {
      const secData = typeof sec.data === 'string'
        ? JSON.parse(sec.data)
        : (sec.data || []);
      for (const item of (Array.isArray(secData) ? secData : [])) {
        const key = item.question_key || item.key || item.id;
        if (!key) continue;
        if (!answersMap[key]) answersMap[key] = [];
        answersMap[key].push(item.value);
      }
    }
  }

  // Compute stats per question
  const plainForm = form.get({ plain: true });
  const sectionStats = (plainForm.sections || []).map((sec) => {
    const questionStats = (sec.questions || []).map((q) => {
      const values = answersMap[q.question_key] || [];
      const n = values.length;

      if (q.type === 'likert') {
        // Exclude 0 (không sử dụng) when computing avg
        const scored = values.map(Number).filter((v) => v > 0);
        const avg = scored.length > 0
          ? scored.reduce((a, b) => a + b, 0) / scored.length
          : null;
        const dist = [0, 0, 0, 0, 0, 0]; // index = score 0..5
        values.forEach((v) => {
          const n = parseInt(v, 10);
          if (n >= 0 && n <= 5) dist[n]++;
        });
        const evaluatedN = n - dist[0]; // exclude "không sử dụng"
        const satisfiedN = dist[4] + dist[5];
        return {
          question_key:   q.question_key,
          type:           q.type,
          label:          q.label,
          score_weight:   parseFloat(q.score_weight),
          n,
          avg:            avg !== null ? parseFloat(avg.toFixed(4)) : null,
          distribution:   dist,
          evaluated_n:    evaluatedN,
          satisfied_n:    satisfiedN,
          satisfied_rate: evaluatedN > 0
            ? parseFloat(((satisfiedN / evaluatedN) * 100).toFixed(2))
            : null,
        };
      }

      if (q.type === 'single' || q.type === 'multi') {
        const dist = {};
        values.forEach((v) => {
          const keys = Array.isArray(v) ? v : [v];
          keys.forEach((k) => {
            if (k !== null && k !== undefined && k !== '') {
              dist[k] = (dist[k] || 0) + 1;
            }
          });
        });
        return {
          question_key: q.question_key,
          type:         q.type,
          label:        q.label,
          n,
          distribution: dist,
        };
      }

      return {
        question_key: q.question_key,
        type:         q.type,
        label:        q.label,
        n,
      };
    });

    // Section Likert average
    const likertStats = questionStats.filter(
      (qs) => qs.type === 'likert' && qs.avg !== null,
    );
    const sectionAvg = likertStats.length > 0
      ? parseFloat(
          (likertStats.reduce((a, b) => a + b.avg, 0) / likertStats.length).toFixed(4),
        )
      : null;

    return {
      section_id:   sec.id,
      title:        sec.title,
      order_index:  sec.order_index,
      section_avg:  sectionAvg,
      questions:    questionStats,
    };
  });

  return {
    form_id: formId,
    form_name: plainForm.name,
    total_feedbacks: totalFeedbacks,
    sections: sectionStats,
  };
};

module.exports = {
  getForms,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
  getFormStats,
};
