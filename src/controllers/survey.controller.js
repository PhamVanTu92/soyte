const surveyService = require('../services/survey.service');
const ApiError = require('../utils/ApiError');

/**
 * Controller for getting surveys
 * @param {Request} req 
 * @param {Response} res 
 */
const getSurveys = async (req, res, next) => {
  try {
    const result = await surveyService.getSurveys(req.query);
    res.status(200).json({
      success: true,
      data: result.items,
      total: result.total,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for getting survey by ID
 * @param {Request} req 
 * @param {Response} res 
 */
const getSurveyById = async (req, res, next) => {
  try {
    const survey = await surveyService.getSurveyById(req.params.id);
    if (!survey) {
      throw new ApiError(404, 'Survey not found');
    }
    res.status(200).json({
      success: true,
      data: survey,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for creating survey
 * @param {Request} req 
 * @param {Response} res 
 */
const createSurvey = async (req, res, next) => {
  try {
    const rawData = Array.isArray(req.body) ? req.body : [req.body];
    const createdSurveys = [];

    for (const item of rawData) {
      const { key, name, type, dateFrom, dateTo, form_ids, status, description, survey_key } = item;

      // Ensure form_ids only contains IDs (integers)
      const refinedFormIds = (form_ids || []).map(formItem => {
        if (typeof formItem === 'object' && formItem !== null) {
          return formItem.id || formItem.form_id || formItem;
        }
        return formItem;
      });

      // Mapping from frontend request keys to model fields
      const surveyData = {
        id: key,
        name,
        type,
        date_from: dateFrom,
        date_to: dateTo,
        form_ids: refinedFormIds,
        status: status !== undefined ? status : true,
        description,
        survey_key: survey_key || key, // Fallback to key if survey_key not explicitly provided
      };

      const newSurvey = await surveyService.createSurvey(surveyData);

      // Fetch formatted survey with form details
      const formattedSurvey = await surveyService.getSurveyById(newSurvey.id);
      createdSurveys.push(formattedSurvey);
    }

    res.status(201).json({
      success: true,
      data: Array.isArray(req.body) ? createdSurveys : createdSurveys[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for updating survey
 * @param {Request} req 
 * @param {Response} res 
 */
const updateSurvey = async (req, res, next) => {
  try {
    const { name, type, dateFrom, dateTo, form_ids, status, description, survey_key } = req.body;

    // Mapping from frontend request keys to model fields
    const survayData = {};
    if (name) survayData.name = name;
    if (type) survayData.type = type;
    if (dateFrom) survayData.date_from = dateFrom;
    if (dateTo) survayData.date_to = dateTo;

    if (form_ids) {
      // Ensure form_ids only contains IDs (integers)
      survayData.form_ids = (form_ids || []).map(item => {
        if (typeof item === 'object' && item !== null) {
          return item.id || item.form_id || item;
        }
        return item;
      });
    }

    if (status !== undefined) survayData.status = status;
    if (description !== undefined) survayData.description = description;
    if (survey_key !== undefined) survayData.survey_key = survey_key;

    const updatedSurveyRaw = await surveyService.updateSurvey(req.params.id, survayData);
    if (!updatedSurveyRaw) {
      throw new ApiError(404, 'Survey not found');
    }

    // Fetch formatted survey with form details
    const formattedSurvey = await surveyService.getSurveyById(req.params.id);

    res.status(200).json({
      success: true,
      data: formattedSurvey,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for deleting survey
 * @param {Request} req 
 * @param {Response} res 
 */
const deleteSurvey = async (req, res, next) => {
  try {
    const deleted = await surveyService.deleteSurvey(req.params.id);
    if (!deleted) {
      throw new ApiError(404, 'Survey not found');
    }
    res.status(200).json({
      success: true,
      message: 'Survey deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSurveys,
  getSurveyById,
  createSurvey,
  updateSurvey,
  deleteSurvey,
};
