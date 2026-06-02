'use strict';
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/form_new.controller');
const { verifyToken: auth } = require('../middlewares/auth.middleware');
const { checkPermission }   = require('../middlewares/checkPermission.middleware');

const formPermission = (req, res, next) => {
  const type = req.body?.type || req.query?.type;
  if (type === 'reflect')  return checkPermission(['forms', 'reflect.form.view'])(req, res, next);
  if (type === 'evaluate') return checkPermission(['forms', 'evaluate.form.view'])(req, res, next);
  return checkPermission(['forms', 'reflect.form.view', 'evaluate.form.view'])(req, res, next);
};

// Public — GET list + GET detail (same as old API)
router.get('/',              ctrl.getForms);
router.get('/:id',           ctrl.getFormById);
router.get('/:id/stats',     ctrl.getFormStats);

// Protected
router.post('/',             auth, formPermission, ctrl.createForm);
router.put('/:id',           auth, formPermission, ctrl.updateForm);
router.delete('/:id',        auth, formPermission, ctrl.deleteForm);

module.exports = router;
