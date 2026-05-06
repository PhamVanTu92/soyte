const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const upload = require('../middlewares/upload.middleware');
const { verifyToken: protect } = require('../middlewares/auth.middleware');

// POST /api/upload
router.post('/', protect, upload.single('file'), uploadController.uploadImage);

module.exports = router;
