'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tradingFacility.controller');
const { verifyToken: auth } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/checkPermission.middleware');

const CAN_MANAGE = ['trading_facility', 'trading_facility.create'];

// ── Options (facility_type / trading_type) — phải đặt TRƯỚC /:id ──
// GET    /api/trading-facilities/options          — lấy tất cả (public)
// GET    /api/trading-facilities/options?kind=... — lọc theo kind
router.get('/options', ctrl.listOptions);

// POST   /api/trading-facilities/options          — thêm loại hình mới
router.post('/options', auth, checkPermission(CAN_MANAGE), ctrl.createOption);

// PUT    /api/trading-facilities/options/:optionId — sửa loại hình
router.put('/options/:optionId', auth, checkPermission(CAN_MANAGE), ctrl.updateOption);

// DELETE /api/trading-facilities/options/:optionId — xóa loại hình (nếu chưa dùng)
router.delete('/options/:optionId', auth, checkPermission(CAN_MANAGE), ctrl.deleteOption);

// ── Trading Facilities ──────────────────────────────────────────
// GET  /api/trading-facilities         — danh sách (public)
router.get('/', ctrl.list);

// GET  /api/trading-facilities/stats   — thống kê (public)
router.get('/stats', ctrl.stats);

// GET  /api/trading-facilities/:id     — chi tiết (public)
router.get('/:id', ctrl.detail);

// POST /api/trading-facilities         — tạo mới
router.post('/', auth, checkPermission(CAN_MANAGE), ctrl.create);

// PUT  /api/trading-facilities/:id     — cập nhật
router.put('/:id', auth, checkPermission(CAN_MANAGE), ctrl.update);

// DELETE /api/trading-facilities/:id   — xóa
router.delete('/:id', auth, checkPermission(CAN_MANAGE), ctrl.remove);

module.exports = router;
