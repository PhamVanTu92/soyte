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

// GET /api/reports/gsat — Báo cáo Giám sát y tế (backend-calculated)
// ?survey_key=<Survey.id>  (bỏ qua → tự lấy survey evaluate active mới nhất)
// Người dùng có unit → mục 1/2/3 hiển thị dữ liệu đơn vị đó; phụ lục đầy đủ.
router.get('/gsat', auth, checkPermission(['report.report_2.view']), reportController.getReportGSAT);

module.exports = router;
