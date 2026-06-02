const surveyNewService = require('../services/survey_new.service');
const ApiError = require('../utils/ApiError');

const getSurveys = async (req, res, next) => {
  try {
    const result = await surveyNewService.getSurveys(req.query);
    res.status(200).json({ success: true, data: result.items, total: result.total });
  } catch (error) {
    next(error);
  }
};

const getSurveyById = async (req, res, next) => {
  try {
    const survey = await surveyNewService.getSurveyById(req.params.id);
    res.status(200).json({ success: true, data: survey });
  } catch (error) {
    next(error);
  }
};

const createSurvey = async (req, res, next) => {
  try {
    const rawData = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];
    for (const item of rawData) {
      results.push(await surveyNewService.createSurvey(item));
    }
    res.status(201).json({
      success: true,
      data: Array.isArray(req.body) ? results : results[0],
    });
  } catch (error) {
    next(error);
  }
};

const updateSurvey = async (req, res, next) => {
  try {
    const updated = await surveyNewService.updateSurvey(req.params.id, req.body);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

const deleteSurvey = async (req, res, next) => {
  try {
    await surveyNewService.deleteSurvey(req.params.id);
    res.status(200).json({ success: true, message: 'Xóa cuộc khảo sát thành công' });
  } catch (error) {
    next(error);
  }
};

// ─── facility endpoints ──────────────────────────────────────────────────────

const getSurveyFacilities = async (req, res, next) => {
  try {
    const data = await surveyNewService.getSurveyFacilities(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const setSurveyFacilities = async (req, res, next) => {
  try {
    const { facility_ids } = req.body;
    if (!Array.isArray(facility_ids)) {
      throw new ApiError(400, 'facility_ids phải là mảng số nguyên');
    }
    const data = await surveyNewService.setSurveyFacilities(req.params.id, facility_ids);
    res.status(200).json({ success: true, message: 'Cập nhật danh sách cơ sở thành công', data });
  } catch (error) {
    next(error);
  }
};

const addSurveyFacility = async (req, res, next) => {
  try {
    const data = await surveyNewService.addSurveyFacility(req.params.id, req.params.facilityId);
    res.status(200).json({ success: true, message: 'Thêm cơ sở thành công', data });
  } catch (error) {
    next(error);
  }
};

const removeSurveyFacility = async (req, res, next) => {
  try {
    await surveyNewService.removeSurveyFacility(req.params.id, req.params.facilityId);
    res.status(200).json({ success: true, message: 'Gỡ cơ sở thành công' });
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
  getSurveyFacilities,
  setSurveyFacilities,
  addSurveyFacility,
  removeSurveyFacility,
};
