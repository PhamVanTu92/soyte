'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tradingFacility.controller');
const { verifyToken: auth } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/checkPermission.middleware');

// GET  /api/trading-facilities         — danh sách (public)
router.get('/', ctrl.list);

// GET  /api/trading-facilities/stats   — thống kê
router.get('/stats', ctrl.stats);

// GET  /api/trading-facilities/:id     — chi tiết (public)
router.get('/:id', ctrl.detail);

// POST /api/trading-facilities         — tạo mới (cần đăng nhập + quyền)
router.post('/', auth, checkPermission(['admin', 'trading_facility.create']), ctrl.create);

// PUT  /api/trading-facilities/:id     — cập nhật (cần đăng nhập + quyền)
router.put('/:id', auth, checkPermission(['admin', 'trading_facility.update']), ctrl.update);

// DELETE /api/trading-facilities/:id   — xóa (cần đăng nhập + quyền)
router.delete('/:id', auth, checkPermission(['admin', 'trading_facility.delete']), ctrl.remove);

module.exports = router;
