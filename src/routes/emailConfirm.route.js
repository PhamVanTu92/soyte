const express = require('express');
const router = express.Router();
const emailConfirmController = require('../controllers/emailConfirm.controller');
const { verifyToken: protect } = require('../middlewares/auth.middleware');
router.use(protect);
router.get('/', emailConfirmController.getEmailSettings);
router.put('/', emailConfirmController.updateEmailSettings);

module.exports = router;
