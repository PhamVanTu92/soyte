const db = require('../models');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');

// ─── helpers ────────────────────────────────────────────────────────────────

const autoUpdateSurveyStatus = async (surveyId = null) => {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const where = { status: true, date_to: { [Op.lt]: today } };
  if (surveyId) where.id = surveyId;
  try {
    await db.Survey.update({ status: false }, { where });
  } catch (e) {
    console.error('survey_new: auto-update status error', e);
  }
};

const formatFacility = (f) => ({
  facility_id: f.id,
  name: f.name,
  address: f.address || null,
  category: f.category || null,
});

const formatSurvey = (survey, forms = [], facilities = []) => {
  if (!survey) return null;
  const json = typeof survey.toJSON === 'function' ? survey.toJSON() : survey;

  const formMap = (forms || []).reduce((acc, f) => {
    if (f) acc[String(f.id)] = { form_id: f.id, name: f.name, status: f.status };
    return acc;
  }, {});

  const currentFormIds = Array.isArray(json.form_ids) ? json.form_ids : [];

  return {
    key: json.id,
    name: json.name,
    type: json.type,
    dateFrom: json.date_from,
    dateTo: json.date_to,
    form_ids: currentFormIds.map(id => {
      const sid = String(id);
      return formMap[sid] || { form_id: !isNaN(id) ? Number(id) : id, name: 'Unknown Form', status: 'unknown' };
    }),
    facilities: facilities.map(formatFacility),
    status: json.status,
    description: json.description,
  };
};

// ─── public API ─────────────────────────────────────────────────────────────

const getSurveys = async (queryOptions = {}) => {
  await autoUpdateSurveyStatus();

  const page  = parseInt(queryOptions.page,  10) || 1;
  const limit = parseInt(queryOptions.limit, 10) || 10;
  const offset = (page - 1) * limit;

  const { name, type, status, ids } = queryOptions;
  const where = {};
  if (name)   where.name = { [Op.like]: `%${name}%` };
  if (type)   where.type = type;
  if (status !== undefined) where.status = status === 'true' || status === true;
  if (ids)    where.id = { [Op.in]: Array.isArray(ids) ? ids : ids.split(',') };

  const { count, rows } = await db.Survey.findAndCountAll({
    where,
    offset,
    limit,
    order: [['created_at', 'DESC']],
    include: [{
      model: db.SocialFacility,
      as: 'facilities',
      attributes: ['id', 'name', 'address', 'category'],
      through: { attributes: [] },
      required: false,
    }],
  });

  const allFormIds = [...new Set(rows.flatMap(r => {
    const fids = r.form_ids;
    return Array.isArray(fids) ? fids.map(String) : [];
  }))];

  let forms = [];
  if (allFormIds.length > 0) {
    forms = await db.Form.findAll({
      where: { id: { [Op.in]: allFormIds } },
      attributes: ['id', 'name', 'status'],
      paranoid: false,
    });
  }

  return {
    items: rows.map(row => formatSurvey(row, forms, row.facilities || [])),
    total: count,
  };
};

const getSurveyById = async (id) => {
  await autoUpdateSurveyStatus(id);

  const survey = await db.Survey.findByPk(id, {
    include: [{
      model: db.SocialFacility,
      as: 'facilities',
      attributes: ['id', 'name', 'address', 'category'],
      through: { attributes: [] },
      required: false,
    }],
  });
  if (!survey) throw new ApiError(404, 'Cuộc khảo sát không tồn tại');

  const fids = Array.isArray(survey.form_ids) ? survey.form_ids.map(String) : [];
  let forms = [];
  if (fids.length > 0) {
    forms = await db.Form.findAll({
      where: { id: { [Op.in]: fids } },
      attributes: ['id', 'name', 'status'],
      paranoid: false,
    });
  }

  return formatSurvey(survey, forms, survey.facilities || []);
};

const createSurvey = async (surveyData) => {
  const { facility_ids, ...rest } = surveyData;

  const refinedFormIds = (rest.form_ids || []).map(item =>
    typeof item === 'object' && item !== null ? (item.id || item.form_id || item) : item
  );

  const data = {
    id: rest.key,
    name: rest.name,
    type: rest.type,
    date_from: rest.date_from || rest.dateFrom,
    date_to: rest.date_to || rest.dateTo,
    form_ids: refinedFormIds,
    status: rest.status !== undefined ? rest.status : true,
    description: rest.description,
  };

  if (data.status !== false) {
    await db.Survey.update({ status: false }, { where: { status: true, type: data.type } });
  }

  const survey = await db.Survey.create(data);

  if (Array.isArray(facility_ids) && facility_ids.length > 0) {
    await setSurveyFacilities(survey.id, facility_ids);
  }

  return getSurveyById(survey.id);
};

const updateSurvey = async (id, surveyData) => {
  const { facility_ids, ...rest } = surveyData;

  const survey = await db.Survey.findByPk(id);
  if (!survey) throw new ApiError(404, 'Cuộc khảo sát không tồn tại');

  const data = {};
  if (rest.name !== undefined)        data.name = rest.name;
  if (rest.type !== undefined)        data.type = rest.type;
  if (rest.date_from || rest.dateFrom) data.date_from = rest.date_from || rest.dateFrom;
  if (rest.date_to   || rest.dateTo)   data.date_to   = rest.date_to   || rest.dateTo;
  if (rest.form_ids) {
    data.form_ids = rest.form_ids.map(item =>
      typeof item === 'object' && item !== null ? (item.id || item.form_id || item) : item
    );
  }
  if (rest.status !== undefined)      data.status = rest.status;
  if (rest.description !== undefined) data.description = rest.description;

  if (data.status === true) {
    await db.Survey.update(
      { status: false },
      { where: { status: true, type: data.type || survey.type, id: { [Op.ne]: id } } }
    );
  }

  await survey.update(data);

  if (Array.isArray(facility_ids)) {
    await setSurveyFacilities(id, facility_ids);
  }

  return getSurveyById(id);
};

const deleteSurvey = async (id) => {
  const survey = await db.Survey.findByPk(id);
  if (!survey) throw new ApiError(404, 'Cuộc khảo sát không tồn tại');
  await survey.destroy();
  return true;
};

// ─── facility management ────────────────────────────────────────────────────

const getSurveyFacilities = async (surveyId) => {
  const survey = await db.Survey.findByPk(surveyId);
  if (!survey) throw new ApiError(404, 'Cuộc khảo sát không tồn tại');

  const rows = await db.SurveyFacility.findAll({
    where: { survey_id: surveyId },
    include: [{
      model: db.SocialFacility,
      as: 'facility',
      attributes: ['id', 'name', 'address', 'category'],
    }],
  });

  return rows.map(r => formatFacility(r.facility));
};

const setSurveyFacilities = async (surveyId, facilityIds) => {
  const survey = await db.Survey.findByPk(surveyId);
  if (!survey) throw new ApiError(404, 'Cuộc khảo sát không tồn tại');

  // facility_id là VARCHAR(50) — giữ nguyên string, không ép kiểu Number
  const ids = [...new Set(facilityIds.map(String).filter(s => s.trim() !== ''))];

  await db.SurveyFacility.destroy({ where: { survey_id: surveyId } });

  if (ids.length > 0) {
    await db.SurveyFacility.bulkCreate(
      ids.map(facility_id => ({ survey_id: surveyId, facility_id })),
      { ignoreDuplicates: true }
    );
  }

  return getSurveyFacilities(surveyId);
};

const addSurveyFacility = async (surveyId, facilityId) => {
  const survey = await db.Survey.findByPk(surveyId);
  if (!survey) throw new ApiError(404, 'Cuộc khảo sát không tồn tại');

  const facility = await db.SocialFacility.findByPk(facilityId);
  if (!facility) throw new ApiError(404, 'Cơ sở không tồn tại');

  await db.SurveyFacility.findOrCreate({
    where: { survey_id: surveyId, facility_id: facilityId },
  });

  return getSurveyFacilities(surveyId);
};

const removeSurveyFacility = async (surveyId, facilityId) => {
  const deleted = await db.SurveyFacility.destroy({
    where: { survey_id: surveyId, facility_id: facilityId },
  });
  if (!deleted) throw new ApiError(404, 'Cơ sở không thuộc cuộc khảo sát này');
  return true;
};

module.exports = {
  getSurveys,
  getSurveyById,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  getSurveyFacilities,
  setSurveyFacilities,
  addSurveyFacility,
  removeSurveyFacility,
};
