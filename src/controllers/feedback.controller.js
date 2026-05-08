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

const getEvaluateDashboard = async (req, res, next) => {
  try {
    // Hỗ trợ nhiều định dạng query:
    //   ?survey_key=1,2,3          → chuỗi phân tách dấu phẩy
    //   ?survey_key=1&survey_key=2 → Express tự gom thành mảng
    //   ?survey_key=5              → đơn lẻ (backward compat)
    const raw = req.query.survey_key;
    let survey_keys = null;

    if (raw) {
      const arr = Array.isArray(raw) ? raw : String(raw).split(',');
      const parsed = arr.map(v => parseInt(v.trim(), 10)).filter(n => !isNaN(n) && n > 0);
      if (parsed.length > 0) survey_keys = parsed;
    }

    // ── Lọc theo đơn vị của user ─────────────────────────────────────
    // Quy tắc đơn giản, không phụ thuộc vào role:
    //   user.unit rỗng / null  → xem tất cả (unit_filter = null)
    //   user.unit có giá trị   → chỉ xem dữ liệu của đơn vị đó
    const unitRaw = req.user?.unit;
    const unit_filter = (unitRaw !== null && unitRaw !== undefined && String(unitRaw).trim() !== '')
      ? String(unitRaw).trim()
      : null;

    const result = await feedbackService.getEvaluateDashboard({ survey_keys, unit_filter });
    res.status(200).json({ success: true, message: 'Lấy dữ liệu dashboard giám sát chất lượng thành công', data: result });
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
  getEvaluateDashboard,
};
