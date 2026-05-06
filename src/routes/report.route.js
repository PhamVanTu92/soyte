const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyToken: auth } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/checkPermission.middleware');

// GET /api/reports/dcbc
router.get('/dcbc', auth, checkPermission(['report.report_1.view']), reportController.getReportDCBC);
router.post('/dcbc', auth, checkPermission(['report.report_1.view']), reportController.getReportDCBC);

// GET /api/reports/tct01
router.get('/tct01', auth, checkPermission(['report.report_3.view']), reportController.getReportTCT01);
router.post('/tct01', auth, checkPermission(['report.report_3.view']), reportController.getReportTCT01);

// GET /api/reports/kshl
router.get('/kshl', auth, checkPermission(['report.report_2.view']), reportController.getReportKSHL);
router.post('/kshl', auth, checkPermission(['report.report_2.view']), reportController.getReportKSHL);

module.exports = router;
