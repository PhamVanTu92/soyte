const db = require('../models');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');

/**
 * Auto-update survey status to false if date_to has passed today
 * @param {number|null} surveyId Optional survey ID to limit the update
 */
const autoUpdateSurveyStatus = async (surveyId = null) => {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const whereClause = {
    status: true,
    date_to: { [Op.lt]: today }
  };

  if (surveyId) {
    whereClause.id = surveyId;
  }

  try {
    await db.Survey.update(
      { status: false },
      { where: whereClause }
    );
  } catch (error) {
    console.error('Error auto-updating survey status:', error);
  }
};

/**
 * Format survey response to match user requirements
 * @param {Survey} survey 
 * @param {Form[]} forms 
 * @returns {object}
 */
const formatSurvey = (survey, forms = []) => {
  if (!survey) return null;
  
  const json = typeof survey.toJSON === 'function' ? survey.toJSON() : survey;
  
  // Create a map for quick form lookup (use string keys for robustness)
  const formMap = (forms || []).reduce((acc, f) => {
    if (f && f.id !== undefined) {
      acc[String(f.id)] = {
        form_id: f.id,
        name: f.name,
        status: f.status
      };
    }
    return acc;
  }, {});

  // Ensure form_ids is an array
  const currentFormIds = Array.isArray(json.form_ids) ? json.form_ids : [];

  return {
    key: json.id,
    name: json.name,
    type: json.type,
    dateFrom: json.date_from,
    dateTo: json.date_to,
    form_ids: currentFormIds.map(id => {
      const stringId = String(id);
      return formMap[stringId] || { 
        form_id: !isNaN(id) && id !== null ? Number(id) : id, 
        name: 'Unknown Form', 
        status: 'unknown' 
      };
    }),
    status: json.status,
    description: json.description,
  };
};

/**
 * Get all surveys with pagination and filtering
 * @param {object} queryOptions 
 * @returns {Promise<{items: object[], total: number}>}
 */
const getSurveys = async (queryOptions = {}) => {
  // Auto-update expired surveys before listing
  await autoUpdateSurveyStatus();

  const page = parseInt(queryOptions.page, 10) || 1;
  const limit = parseInt(queryOptions.limit, 10) || 10;
  const offset = (page - 1) * limit;

  const { name, type, status, ids } = queryOptions;
  const where = {};

  if (name) {
    where.name = { [Op.like]: `%${name}%` };
  }
  if (type) {
    where.type = type;
  }
  if (status !== undefined) {
    where.status = status === 'true' || status === true;
  }
  if (ids) {
    where.id = { [Op.in]: Array.isArray(ids) ? ids : ids.split(',') };
  }

  const { count, rows } = await db.Survey.findAndCountAll({
    where,
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });

  // Extract all unique form IDs from the results
  const allFormIds = [...new Set(rows.flatMap(r => {
    const ids = r.form_ids;
    return Array.isArray(ids) ? ids.map(id => String(id)) : [];
  }))];

  // Fetch related forms from DB (including soft-deleted ones)
  let forms = [];
  if (allFormIds.length > 0) {
    forms = await db.Form.findAll({
      where: { id: { [Op.in]: allFormIds } },
      attributes: ['id', 'name', 'status'],
      paranoid: false // Important: include soft-deleted forms
    });
  }

  return {
    items: rows.map(row => formatSurvey(row, forms)),
    total: count
  };
};

/**
 * Get survey by ID
 * @param {number} id 
 * @returns {Promise<object|null>}
 */
const getSurveyById = async (id) => {
  // Auto-update expired survey before fetching
  await autoUpdateSurveyStatus(id);

  const survey = await db.Survey.findByPk(id);
  if (!survey) {
    throw new ApiError(404, 'Cuộc khảo sát không tồn tại');
  }

  // Extract IDs as strings for lookup
  const currentFormIds = Array.isArray(survey.form_ids) ? survey.form_ids.map(fid => String(fid)) : [];
  
  let forms = [];
  if (currentFormIds.length > 0) {
    forms = await db.Form.findAll({
      where: { id: { [Op.in]: currentFormIds } },
      attributes: ['id', 'name', 'status'],
      paranoid: false // Important: include soft-deleted forms
    });
  }

  return formatSurvey(survey, forms);
};

/**
 * Create a new survey
 * @param {object} surveyData 
 * @returns {Promise<Survey>}
 */
const createSurvey = async (surveyData) => {
  // If launching a new active survey, deactivate existing ones of the same type
  if (surveyData.status !== false) {
    await db.Survey.update(
      { status: false },
      { where: { status: true, type: surveyData.type } }
    );
  }
  return await db.Survey.create(surveyData);
};

/**
 * Update survey
 * @param {number} id 
 * @param {object} surveyData 
 * @returns {Promise<Survey|null>}
 */
const updateSurvey = async (id, surveyData) => {
  const survey = await db.Survey.findByPk(id);
  if (!survey) {
    throw new ApiError(404, 'Cuộc khảo sát không tồn tại');
  }

  // If activating this survey, deactivate others of the same type
  if (surveyData.status === true) {
    await db.Survey.update(
      { status: false },
      { where: { status: true, type: surveyData.type || survey.type, id: { [Op.ne]: id } } }
    );
  }
  
  return await survey.update(surveyData);
};

/**
 * Delete survey
 * @param {number} id 
 * @returns {Promise<boolean>}
 */
const deleteSurvey = async (id) => {
  const survey = await db.Survey.findByPk(id);
  if (!survey) {
    throw new ApiError(404, 'Cuộc khảo sát không tồn tại');
  }
  
  await survey.destroy();
  return true;
};

module.exports = {
  getSurveys,
  getSurveyById,
  createSurvey,
  updateSurvey,
  deleteSurvey,
};
