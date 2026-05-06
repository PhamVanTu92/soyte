const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/survey.controller');

const { verifyToken: auth } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/checkPermission.middleware');

// GET /api/surveys
router.get('/', surveyController.getSurveys);

// GET /api/surveys/:id
router.get('/:id', surveyController.getSurveyById);

// POST /api/surveys
router.post('/', auth, (req, res, next) => {
  const { type } = req.body;
  if (type === 'reflect') return checkPermission(['reflect.survey.view'])(req, res, next);
  if (type === 'evaluate') return checkPermission(['evaluate.survey.view'])(req, res, next);
  return checkPermission(['survey.view'])(req, res, next);
}, surveyController.createSurvey);

// PUT /api/surveys/:id
router.put('/:id', auth, (req, res, next) => {
  const { type } = req.body;
  if (type === 'reflect') return checkPermission(['reflect.survey.view'])(req, res, next);
  if (type === 'evaluate') return checkPermission(['evaluate.survey.view'])(req, res, next);
  return checkPermission(['survey.view'])(req, res, next);
}, surveyController.updateSurvey);

// DELETE /api/surveys/:id
router.delete('/:id', auth, (req, res, next) => {
  return checkPermission(['survey.view'])(req, res, next);
}, surveyController.deleteSurvey);

module.exports = router;
