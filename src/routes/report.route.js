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

// GET /api/reports/gsat — Báo cáo Giám sát y tế (tính toán phía backend)
// Hỗ trợ user-unit-aware: nếu người dùng được gán vào cơ sở y tế cụ thể,
// mục 1/2/3 sẽ chỉ hiển thị dữ liệu của cơ sở đó.
router.get('/gsat', auth, checkPermission(['report.report_2.view']), reportController.getReportGSAT);
router.post('/gsat', auth, checkPermission(['report.report_2.view']), reportController.getReportGSAT);

module.exports = router;
