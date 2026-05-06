const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');
const { verifyToken: auth, optionalAuth } = require('../middlewares/auth.middleware');
const { checkPermission, checkPermissionIfAuthenticated } = require('../middlewares/checkPermission.middleware');

// @access  Public (Guest) / Optional Auth (Logged in)
router.post('/', optionalAuth, feedbackController.createFeedback);

// @route   GET api/feedbacks
// @desc    Get all feedbacks
// @access  Private/Feedback Permission
router.get('/', auth, (req, res, next) => {
  const { type, report_type } = req.query;
  if (type === 'reflect' || report_type == 1 || report_type == 3)
    return checkPermission(['feedback', 'reflect.list_feedback.view', 'report.report_1.view', 'report.report_3.view'])(req, res, next);
  if (type === 'evaluate' || report_type == 2)
    return checkPermission(['feedback', 'evaluate.list_feedback.view', 'report.report_2.view'])(req, res, next);
  return checkPermission([
    'feedback',
    'reflect.list_feedback.view',
    'evaluate.list_feedback.view',
    'report.report_1.view',
    'report.report_2.view',
    'report.report_3.view'
  ])(req, res, next);
}, feedbackController.getFeedbacks);
router.post('/list', auth, (req, res, next) => {
  const { type, report_type } = { ...req.query, ...req.body };
  if (type === 'reflect' || report_type == 1 || report_type == 3)
    return checkPermission(['feedback', 'reflect.list_feedback.view', 'report.report_1.view', 'report.report_3.view'])(req, res, next);
  if (type === 'evaluate' || report_type == 2)
    return checkPermission(['feedback', 'evaluate.list_feedback.view', 'report.report_2.view'])(req, res, next);
  return checkPermission([
    'feedback',
    'reflect.list_feedback.view',
    'evaluate.list_feedback.view',
    'report.report_1.view',
    'report.report_2.view',
    'report.report_3.view'
  ])(req, res, next);
}, feedbackController.getFeedbacks);

// @route   GET api/feedbacks/stats
// @desc    Get feedback statistics
// @access  Private/Feedback Permission
router.get('/stats', auth, (req, res, next) => {
  const { type, report_type } = req.query;
  if (report_type == 1) return checkPermission(['feedback', 'report.report_1.view'])(req, res, next);
  if (report_type == 2) return checkPermission(['feedback', 'report.report_2.view'])(req, res, next);
  if (report_type == 3) return checkPermission(['feedback', 'report.report_3.view'])(req, res, next);

  if (type === 'reflect') return checkPermission(['feedback', 'report.report_1.view', 'report.report_3.view'])(req, res, next);
  if (type === 'evaluate') return checkPermission(['feedback', 'report.report_2.view'])(req, res, next);
  return checkPermission(['feedback', 'report.view', 'report.report_1.view', 'report.report_2.view', 'report.report_3.view'])(req, res, next);
}, feedbackController.getFeedbackStats);
router.post('/stats', auth, (req, res, next) => {
  const { type, report_type } = { ...req.query, ...req.body };
  if (report_type == 1) return checkPermission(['feedback', 'report.report_1.view'])(req, res, next);
  if (report_type == 2) return checkPermission(['feedback', 'report.report_2.view'])(req, res, next);
  if (report_type == 3) return checkPermission(['feedback', 'report.report_3.view'])(req, res, next);

  if (type === 'reflect') return checkPermission(['feedback', 'report.report_1.view', 'report.report_3.view'])(req, res, next);
  if (type === 'evaluate') return checkPermission(['feedback', 'report.report_2.view'])(req, res, next);
  return checkPermission(['feedback', 'report.view', 'report.report_1.view', 'report.report_2.view', 'report.report_3.view'])(req, res, next);
}, feedbackController.getFeedbackStats);

// @route   GET api/feedbacks/compare
// @desc    Get feedback comparison
// @access  Private/Feedback Permission
router.get('/compare', auth, (req, res, next) => {
  const { type, report_type } = req.query;
  if (report_type == 1) return checkPermission(['feedback', 'report.report_1.view'])(req, res, next);
  if (report_type == 2) return checkPermission(['feedback', 'report.report_2.view'])(req, res, next);

  if (type === 'reflect' || report_type == 1 || report_type == 3)
    return checkPermission(['feedback', 'report.report_1.view', 'report.report_3.view'])(req, res, next);
  if (type === 'evaluate' || report_type == 2)
    return checkPermission(['feedback', 'report.report_2.view'])(req, res, next);
  return checkPermission(['feedback', 'report.view', 'report.report_1.view', 'report.report_2.view'])(req, res, next);
}, feedbackController.getFeedbackComparison);
router.post('/compare', auth, (req, res, next) => {
  const { type, report_type } = { ...req.query, ...req.body };
  if (report_type == 1) return checkPermission(['feedback', 'report.report_1.view'])(req, res, next);
  if (report_type == 2) return checkPermission(['feedback', 'report.report_2.view'])(req, res, next);

  if (type === 'reflect' || report_type == 1 || report_type == 3)
    return checkPermission(['feedback', 'report.report_1.view', 'report.report_3.view'])(req, res, next);
  if (type === 'evaluate' || report_type == 2)
    return checkPermission(['feedback', 'report.report_2.view'])(req, res, next);
  return checkPermission(['feedback', 'report.view', 'report.report_1.view', 'report.report_2.view'])(req, res, next);
}, feedbackController.getFeedbackComparison);

// @route   GET api/feedbacks/check-unit
// @desc    Check if a specific unit has submitted the survey
// @access  Private/Feedback Permission
router.get('/check-unit', feedbackController.checkUnitSubmission);

// @route   GET api/feedbacks/:id
// @desc    Get feedback by ID
// @access  Private/Feedback Permission
router.get('/:id', auth, (req, res, next) => {
  return checkPermission([
    'feedback',
    'reflect.list_feedback.view',
    'evaluate.list_feedback.view',
    'report.report_1.view',
    'report.report_2.view',
    'report.report_3.view'
  ])(req, res, next);
}, feedbackController.getFeedbackById);

// @route   DELETE api/feedbacks/:id
// @desc    Delete feedback
// @access  Private/Feedback Permission
router.delete('/:id', auth, (req, res, next) => {
  return checkPermission([
    'feedback',
    'reflect.list_feedback.view',
    'evaluate.list_feedback.view',
    'report.report_1.view',
    'report.report_2.view',
    'report.report_3.view'
  ])(req, res, next);
}, feedbackController.deleteFeedback);

module.exports = router;
