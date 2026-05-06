const express = require('express');
const router = express.Router();
const formController = require('../controllers/form.controller');
const { verifyToken: auth } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/checkPermission.middleware');

router.post('/', auth, (req, res, next) => {
  const { type } = req.body;
  if (type === 'reflect') return checkPermission(['forms', 'reflect.form.view'])(req, res, next);
  if (type === 'evaluate') return checkPermission(['forms', 'evaluate.form.view'])(req, res, next);
  return checkPermission(['forms', 'reflect.form.view', 'evaluate.form.view'])(req, res, next);
}, formController.createForm);

router.get('/', formController.getForms);

router.get('/:id', formController.getFormById);

router.put('/:id', auth, (req, res, next) => {
  const { type } = req.body;
  if (type === 'reflect') return checkPermission(['forms', 'reflect.form.view'])(req, res, next);
  if (type === 'evaluate') return checkPermission(['forms', 'evaluate.form.view'])(req, res, next);
  return checkPermission(['forms', 'reflect.form.view', 'evaluate.form.view'])(req, res, next);
}, formController.updateForm);

module.exports = router;
