const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/feedback_new.controller');
const { verifyToken: auth } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/checkPermission.middleware');

const listPermGuard = (req, res, next) => {
  const { type } = { ...req.query, ...req.body };
  if (type === 'reflect')
    return checkPermission(['feedback', 'reflect.list_feedback.view', 'report.report_1.view', 'report.report_3.view'])(req, res, next);
  if (type === 'evaluate')
    return checkPermission(['feedback', 'evaluate.list_feedback.view', 'report.report_2.view'])(req, res, next);
  return checkPermission([
    'feedback', 'reflect.list_feedback.view', 'evaluate.list_feedback.view',
    'report.report_1.view', 'report.report_2.view', 'report.report_3.view',
  ])(req, res, next);
};

// GET  /api/feedbacks-new
//   Query: type, survey_key, survey_id, facility_id, startDate, endDate, status, page, limit
router.get('/', auth, listPermGuard, ctrl.getFeedbacks);

// POST /api/feedbacks-new/list  (body-based query, mirror pattern cũ)
router.post('/list', auth, listPermGuard, ctrl.getFeedbacks);

// GET  /api/feedbacks-new/survey/:surveyId/facility-status
//   Trả về danh sách cơ sở của survey + từng cơ sở đã submit chưa
router.get('/survey/:surveyId/facility-status', auth, listPermGuard, ctrl.getSurveyFacilityStatus);

// GET  /api/feedbacks-new/facility/:facilityId
//   Danh sách phản hồi của 1 cơ sở
router.get('/facility/:facilityId', auth, listPermGuard, ctrl.getFeedbacksByFacility);

// GET  /api/feedbacks-new/:id
router.get('/:id', auth, listPermGuard, ctrl.getFeedbackById);

module.exports = router;
