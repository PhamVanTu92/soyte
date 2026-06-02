/**
 * feedback_new.service.js
 * Danh sách phản hồi phiên bản mới — hỗ trợ filter facility_id qua bảng
 * survey_facilities thay vì parse JSON info. Song song với feedback.service.js,
 * không thay thế.
 */
const db = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');
const { getDateRange } = require('../utils/dateUtils');

const MAX_LIST_LIMIT = 100;

// ─── helpers ────────────────────────────────────────────────────────────────

const formatFeedbackItem = (row) => {
  const json = typeof row.toJSON === 'function' ? row.toJSON() : row;
  return json;
};

const formatFeedbackDetail = (feedback) => {
  if (!feedback) return null;
  const json = feedback.toJSON();
  if (json.sections) {
    json.sections = json.sections.map(section => {
      if (section.option) {
        section.option = section.option.map(opt => {
          const { data, ...rest } = opt;
          return { ...rest, ...(data || {}) };
        });
      }
      return section;
    });
  }
  return json;
};

// ─── getFeedbacks ────────────────────────────────────────────────────────────

/**
 * Lấy danh sách phản hồi với filter mới:
 *   - facility_id  : filter theo cơ sở (qua survey_facilities)
 *   - survey_id    : filter theo survey (thay vì survey_key cũ)
 *   - survey_key   : vẫn hỗ trợ (backward compat)
 *   - type, startDate, endDate, status, page, limit
 */
const getFeedbacks = async (queryOptions = {}) => {
  const page  = parseInt(queryOptions.page,  10) || 1;
  const limit = Math.min(parseInt(queryOptions.limit, 10) || 10, MAX_LIST_LIMIT);
  const offset = (page - 1) * limit;

  const { type, startDate, endDate, status, facility_id, survey_id } = queryOptions;

  const where = { survey_key: { [Op.ne]: null } };

  if (type)   where.type = type;
  if (status) where.status = status;

  // filter theo survey_key (cũ) hoặc survey_id (mới)
  if (queryOptions.survey_key) {
    const keys = Array.isArray(queryOptions.survey_key)
      ? queryOptions.survey_key
      : String(queryOptions.survey_key).split(',').map(s => s.trim());
    where.survey_key = { [Op.in]: keys };
  } else if (survey_id) {
    const ids = Array.isArray(survey_id)
      ? survey_id
      : String(survey_id).split(',').map(s => s.trim());
    where.survey_key = { [Op.in]: ids };
  }

  // filter theo facility_id qua survey_facilities → lấy survey_ids → filter feedbacks
  if (facility_id) {
    const facilityIds = Array.isArray(facility_id)
      ? facility_id.map(Number)
      : String(facility_id).split(',').map(Number).filter(n => !isNaN(n));

    const surveyFacilityRows = await db.SurveyFacility.findAll({
      where: { facility_id: { [Op.in]: facilityIds } },
      attributes: ['survey_id'],
    });

    const linkedSurveyIds = [...new Set(surveyFacilityRows.map(r => String(r.survey_id)))];
    if (linkedSurveyIds.length === 0) {
      return { items: [], total: 0, page, limit };
    }

    // survey_key = survey.id (string) per existing code pattern
    if (where.survey_key && where.survey_key[Op.in]) {
      // intersection
      const existing = new Set(where.survey_key[Op.in]);
      const intersect = linkedSurveyIds.filter(k => existing.has(k));
      if (intersect.length === 0) return { items: [], total: 0, page, limit };
      where.survey_key = { [Op.in]: intersect };
    } else {
      where.survey_key = { [Op.in]: linkedSurveyIds };
    }
  }

  try {
    const range = getDateRange(startDate, endDate);
    if (range) {
      if (range[0] && range[1])      where.created_at = { [Op.between]: range };
      else if (range[0])             where.created_at = { [Op.gte]: range[0] };
      else if (range[1])             where.created_at = { [Op.lte]: range[1] };
    }
  } catch (_) {}

  const attributes = ['id', 'form_id', 'creator_name', 'type', 'status', 'survey_key', 'info', 'user_id', 'created_at'];

  const { count, rows } = await db.Feedback.findAndCountAll({
    where,
    attributes,
    distinct: true,
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });

  return {
    items: rows.map(formatFeedbackItem),
    total: count,
    page,
    limit,
  };
};

// ─── getFeedbackById ─────────────────────────────────────────────────────────

const getFeedbackById = async (id) => {
  const result = await db.Feedback.findByPk(id, {
    include: [{
      model: db.FeedbackSection,
      as: 'sections',
      include: [{ model: db.FeedbackOption, as: 'option' }],
    }],
  });
  if (!result) throw new Error('Phản hồi không tồn tại');
  return formatFeedbackDetail(result);
};

// ─── getFeedbacksByFacility ──────────────────────────────────────────────────

/**
 * Lấy danh sách phản hồi của 1 cơ sở cụ thể, nhóm theo survey.
 */
const getFeedbacksByFacility = async (facilityId, queryOptions = {}) => {
  const surveyFacilityRows = await db.SurveyFacility.findAll({
    where: { facility_id: facilityId },
    attributes: ['survey_id'],
  });

  const surveyIds = surveyFacilityRows.map(r => String(r.survey_id));
  if (surveyIds.length === 0) return { items: [], total: 0 };

  return getFeedbacks({ ...queryOptions, facility_id: facilityId });
};

// ─── getSurveyFacilityStatus ─────────────────────────────────────────────────

/**
 * Với 1 survey, trả về danh sách cơ sở + đã có phản hồi chưa.
 */
const getSurveyFacilityStatus = async (surveyId) => {
  const surveyFacilities = await db.SurveyFacility.findAll({
    where: { survey_id: surveyId },
    include: [{
      model: db.SocialFacility,
      as: 'facility',
      attributes: ['id', 'name', 'address', 'code'],
    }],
  });

  if (surveyFacilities.length === 0) return [];

  const facilityIds = surveyFacilities.map(r => r.facility_id);

  // Feedbacks của survey này
  const feedbacks = await db.Feedback.findAll({
    where: { survey_key: String(surveyId) },
    attributes: ['id', 'info', 'status', 'created_at'],
  });

  // Map facility_id → feedbacks bằng cách kiểm tra info JSON (giữ lại logic cũ làm fallback)
  const facilityFeedbackMap = {};
  for (const fb of feedbacks) {
    let info = fb.info;
    if (typeof info === 'string') {
      try { info = JSON.parse(info); } catch (_) { info = null; }
    }
    // Tìm facility_id trong info
    let matchedFacilityId = null;
    if (info && typeof info === 'object') {
      const checkValue = (val) => {
        if (!val) return null;
        if (typeof val === 'object' && val.key && !isNaN(Number(val.key))) return Number(val.key);
        if (!isNaN(Number(val))) return Number(val);
        return null;
      };
      if (Array.isArray(info)) {
        const unitItem = info.find(i => {
          const n = (i.name || i.label || '').toLowerCase();
          return n.includes('đơn vị') || n === 'unit';
        });
        if (unitItem) matchedFacilityId = checkValue(unitItem.value);
      } else {
        for (const k in info) {
          if (k === 'title' || k === 'description') continue;
          const item = info[k];
          if (item && item.value) {
            const id = checkValue(item.value.key || item.value);
            if (id && facilityIds.includes(id)) { matchedFacilityId = id; break; }
          }
        }
      }
    }
    if (matchedFacilityId && facilityIds.includes(matchedFacilityId)) {
      if (!facilityFeedbackMap[matchedFacilityId]) facilityFeedbackMap[matchedFacilityId] = [];
      facilityFeedbackMap[matchedFacilityId].push({
        id: fb.id,
        status: fb.status,
        created_at: fb.created_at,
      });
    }
  }

  return surveyFacilities.map(sf => ({
    facility_id: sf.facility_id,
    name: sf.facility?.name || null,
    address: sf.facility?.address || null,
    code: sf.facility?.code || null,
    submitted: !!(facilityFeedbackMap[sf.facility_id]?.length),
    feedbacks: facilityFeedbackMap[sf.facility_id] || [],
  }));
};

module.exports = {
  getFeedbacks,
  getFeedbackById,
  getFeedbacksByFacility,
  getSurveyFacilityStatus,
};
