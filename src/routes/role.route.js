'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/role.controller');
const { verifyToken: auth } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/checkPermission.middleware');

const adminOnly = [auth, checkPermission(['admin'])];

// GET    /api/roles                          — danh sách roles
router.get('/', auth, ctrl.list);

// GET    /api/roles/assign-user              — gán role cho user (trước :id)
router.put('/assign-user', ...adminOnly, ctrl.assignUser);

// GET    /api/roles/user/:userId/permissions — quyền hiệu lực của user
router.get('/user/:userId/permissions', auth, ctrl.userEffectivePermissions);

// GET    /api/roles/:id                      — chi tiết role
router.get('/:id', auth, ctrl.detail);

// POST   /api/roles                          — tạo role
router.post('/', ...adminOnly, ctrl.create);

// PUT    /api/roles/:id                      — cập nhật role
router.put('/:id', ...adminOnly, ctrl.update);

// PUT    /api/roles/:id/permissions          — gán permissions cho role
router.put('/:id/permissions', ...adminOnly, ctrl.setPermissions);

// DELETE /api/roles/:id                      — xóa role
router.delete('/:id', ...adminOnly, ctrl.remove);

module.exports = router;
