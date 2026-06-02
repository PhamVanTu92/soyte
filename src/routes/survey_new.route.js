const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/survey_new.controller');
const { verifyToken: auth } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/checkPermission.middleware');

const surveyPermGuard = (req, res, next) => {
  const type = req.body?.type || req.query?.type;
  if (type === 'reflect')  return checkPermission(['reflect.survey.view'])(req, res, next);
  if (type === 'evaluate') return checkPermission(['evaluate.survey.view'])(req, res, next);
  return checkPermission(['survey.view'])(req, res, next);
};

// ─── survey CRUD ─────────────────────────────────────────────────────────────
router.get('/',     ctrl.getSurveys);
router.get('/:id',  ctrl.getSurveyById);
router.post('/',    auth, surveyPermGuard, ctrl.createSurvey);
router.put('/:id',  auth, surveyPermGuard, ctrl.updateSurvey);
router.delete('/:id', auth, checkPermission(['survey.view']), ctrl.deleteSurvey);

// ─── facility sub-resource ────────────────────────────────────────────────────
// GET    /api/surveys-new/:id/facilities           → danh sách cơ sở
// POST   /api/surveys-new/:id/facilities           → set toàn bộ danh sách (body: { facility_ids: [] })
// PUT    /api/surveys-new/:id/facilities/:facilityId → thêm 1 cơ sở
// DELETE /api/surveys-new/:id/facilities/:facilityId → gỡ 1 cơ sở

router.get('/:id/facilities',    ctrl.getSurveyFacilities);
router.post('/:id/facilities',   auth, checkPermission(['survey.view']), ctrl.setSurveyFacilities);
router.put('/:id/facilities/:facilityId',    auth, checkPermission(['survey.view']), ctrl.addSurveyFacility);
router.delete('/:id/facilities/:facilityId', auth, checkPermission(['survey.view']), ctrl.removeSurveyFacility);

module.exports = router;
