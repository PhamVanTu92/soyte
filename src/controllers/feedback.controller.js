const feedbackService = require('../services/feedback.service');
const ApiError = require('../utils/ApiError');

const createFeedback = async (req, res, next) => {
  try {
    const feedback = await feedbackService.createFeedback(req.body);
    res.status(201).json({ success: true, message: 'Feedback submitted successfully', data: feedback });
  } catch (error) {
    next(error);
  }
};

const getFeedbacks = async (req, res, next) => {
  try {
    const queryParams = { ...req.query, ...req.body };
    const result = await feedbackService.getFeedbacks(queryParams);
    res.status(200).json({ success: true, message: 'Feedbacks retrieved successfully', data: result });
  } catch (error) {
    next(error);
  }
};

const getFeedbackById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await feedbackService.getFeedbackById(id);
    if (!result) {
      throw new ApiError(404, 'Feedback not found');
    }
    res.status(200).json({ success: true, message: 'Feedback retrieved successfully', data: result });
  } catch (error) {
    next(error);
  }
};

const getFeedbackStats = async (req, res, next) => {
  try {
    const queryParams = { ...req.query, ...req.body };
    const result = await feedbackService.getFeedbackStats(queryParams);
    res.status(200).json({ success: true, message: 'Lấy thống kê thành công', data: result });
  } catch (error) {
    next(error);
  }
};

const getFeedbackComparison = async (req, res, next) => {
  try {
    const queryParams = { ...req.query, ...req.body };
    const result = await feedbackService.getFeedbackComparison(queryParams);
    res.status(200).json({ success: true, message: 'Lấy dữ liệu so sánh thành công', data: result });
  } catch (error) {
    next(error);
  }
};

const checkUnitSubmission = async (req, res, next) => {
  try {
    const result = await feedbackService.checkUnitSubmission(req.query);
    res.status(200).json({
      success: result.success ?? true,
      message: result.message ?? '',
      ...(result.is_submitted !== undefined && { is_submitted: result.is_submitted }),
    });
  } catch (error) {
    next(error);
  }
};

const deleteFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    await feedbackService.deleteFeedback(id);
    res.status(200).json({ success: true, message: 'Xóa phản hồi thành công' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFeedback,
  getFeedbacks,
  getFeedbackById,
  getFeedbackStats,
  getFeedbackComparison,
  checkUnitSubmission,
  deleteFeedback,
};
