'use strict';
/**
 * feedback_new.route.js
 *
 * Tất cả endpoints /api/feedbacks-new — thay thế hoàn toàn /api/feedbacks
 * - Giữ nguyên permission guard như cũ
 * - Các endpoint mới (facility-status) dùng ctrl mới
 * - Các endpoint cũ (stats, compare, dashboard…) reuse controller cũ
 */

const express  = require('express');
const router   = express.Router();
const ctrlNew  = require('../controllers/feedback_new.controller');
const ctrlOld  = require('../controllers/feedback.controller');    // reuse logic cũ
const { verifyToken: auth, optionalAuth } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/checkPermission.middleware');

/* ── Permission guards (giữ nguyên rule cũ) ────────────────── */
const listGuard = (req, res, next) => {
  const { type, report_type } = { ...req.query, ...req.body };
  if (type === 'reflect' || report_type == 1 || report_type == 3)
    return checkPermission(['feedback', 'reflect.list_feedback.view', 'report.report_1.view', 'report.report_3.view'])(req, res, next);
  if (type === 'evaluate' || report_type == 2)
    return checkPermission(['feedback', 'evaluate.list_feedback.view', 'report.report_2.view'])(req, res, next);
  return checkPermission([
    'feedback', 'reflect.list_feedback.view', 'evaluate.list_feedback.view',
    'report.report_1.view', 'report.report_2.view', 'report.report_3.view',
  ])(req, res, next);
};

const statsGuard = (req, res, next) => {
  const { type, report_type } = { ...req.query, ...req.body };
  if (report_type == 1) return checkPermission(['feedback', 'report.report_1.view'])(req, res, next);
  if (report_type == 2) return checkPermission(['feedback', 'report.report_2.view'])(req, res, next);
  if (report_type == 3) return checkPermission(['feedback', 'report.report_3.view'])(req, res, next);
  if (type === 'reflect')  return checkPermission(['feedback', 'report.report_1.view', 'report.report_3.view'])(req, res, next);
  if (type === 'evaluate') return checkPermission(['feedback', 'report.report_2.view'])(req, res, next);
  return checkPermission(['feedback', 'report.view', 'report.report_1.view', 'report.report_2.view', 'report.report_3.view'])(req, res, next);
};

const compareGuard = (req, res, next) => {
  const { type, report_type } = { ...req.query, ...req.body };
  if (report_type == 1) return checkPermission(['feedback', 'report.report_1.view'])(req, res, next);
  if (report_type == 2) return checkPermission(['feedback', 'report.report_2.view'])(req, res, next);
  if (type === 'reflect'  || report_type == 3) return checkPermission(['feedback', 'report.report_1.view', 'report.report_3.view'])(req, res, next);
  if (type === 'evaluate') return checkPermission(['feedback', 'report.report_2.view'])(req, res, next);
  return checkPermission(['feedback', 'report.view', 'report.report_1.view', 'report.report_2.view'])(req, res, next);
};

/* ── Submit phản hồi (public — giống POST /feedbacks) ────── */
router.post('/', optionalAuth, ctrlOld.createFeedback);

/* ── Danh sách ────────────────────────────────────────────── */
router.get('/',        auth, listGuard, ctrlNew.getFeedbacks);
router.post('/list',   auth, listGuard, ctrlNew.getFeedbacks);

/* ── Thống kê (reuse controller cũ) ────────────────────────── */
router.get('/stats',   auth, statsGuard,   ctrlOld.getFeedbackStats);
router.post('/stats',  auth, statsGuard,   ctrlOld.getFeedbackStats);

/* ── So sánh (reuse controller cũ) ─────────────────────────── */
router.get('/compare', auth, compareGuard, ctrlOld.getFeedbackComparison);
router.post('/compare',auth, compareGuard, ctrlOld.getFeedbackComparison);

/* ── Dashboard giám sát chất lượng ────────────────────────── */
router.get('/evaluate-dashboard', auth,
  checkPermission(['feedback', 'evaluate.list_feedback.view', 'report.report_2.view']),
  ctrlOld.getEvaluateDashboard,
);

/* ── Kiểm tra đơn vị đã nộp chưa ──────────────────────────── */
router.get('/check-unit', ctrlOld.checkUnitSubmission);

/* ── Trạng thái nộp phiếu theo cơ sở (mới) ─────────────────── */
router.get('/survey/:surveyId/facility-status', auth, listGuard, ctrlNew.getSurveyFacilityStatus);

/* ── Danh sách phản hồi của 1 cơ sở (mới) ──────────────────── */
router.get('/facility/:facilityId', auth, listGuard, ctrlNew.getFeedbacksByFacility);

/* ── Chi tiết + Xoá ─────────────────────────────────────────── */
router.get('/:id', auth, listGuard, ctrlNew.getFeedbackById);
router.delete('/:id', auth, listGuard, ctrlOld.deleteFeedback);

module.exports = router;
