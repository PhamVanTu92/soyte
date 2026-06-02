const feedbackNewService = require('../services/feedback_new.service');

const getFeedbacks = async (req, res, next) => {
  try {
    const queryParams = { ...req.query, ...req.body };
    const result = await feedbackNewService.getFeedbacks(queryParams);
    res.status(200).json({ success: true, message: 'Lấy danh sách phản hồi thành công', data: result });
  } catch (error) {
    next(error);
  }
};

const getFeedbackById = async (req, res, next) => {
  try {
    const result = await feedbackNewService.getFeedbackById(req.params.id);
    res.status(200).json({ success: true, message: 'Lấy phản hồi thành công', data: result });
  } catch (error) {
    next(error);
  }
};

const getFeedbacksByFacility = async (req, res, next) => {
  try {
    const result = await feedbackNewService.getFeedbacksByFacility(req.params.facilityId, req.query);
    res.status(200).json({ success: true, message: 'Lấy phản hồi theo cơ sở thành công', data: result });
  } catch (error) {
    next(error);
  }
};

const getSurveyFacilityStatus = async (req, res, next) => {
  try {
    const result = await feedbackNewService.getSurveyFacilityStatus(req.params.surveyId);
    res.status(200).json({ success: true, message: 'Lấy trạng thái cơ sở theo khảo sát thành công', data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFeedbacks,
  getFeedbackById,
  getFeedbacksByFacility,
  getSurveyFacilityStatus,
};
