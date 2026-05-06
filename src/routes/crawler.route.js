const express = require('express');
const router = express.Router();
const crawlerController = require('../controllers/crawler.controller');
const { verifyToken: protect } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/checkPermission.middleware');

// Định nghĩa route cho API
// GET /api/crawled-schedules
router.get('/', protect, checkPermission('work_schedule'), crawlerController.getCrawledSchedules);

module.exports = router;
