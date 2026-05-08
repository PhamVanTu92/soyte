'use strict';

const express = require('express');
const router = express.Router();
const ctrl   = require('../controllers/banner.controller');
const upload = require('../middlewares/upload.middleware');
const { verifyToken: auth } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/checkPermission.middleware');

const CAN_MANAGE = ['banner', 'banner.create'];

// ── Public ───────────────────────────────────────────────────────
// GET /api/banners               — tất cả (nhóm theo position)
// GET /api/banners?position=top  — lọc theo vị trí
router.get('/', ctrl.list);

// GET /api/banners/:id
router.get('/:id', ctrl.detail);

// ── Quản trị ─────────────────────────────────────────────────────
// POST /api/banners
//   - multipart/form-data: upload ảnh trực tiếp (1 file: field "file", nhiều file: field "files")
//   - application/json:    { position, image_url, title?, link_url?, sort_order? }
//                          { items: [{ position, image_url, ... }] }  ← nhiều cùng lúc
router.post('/',
  auth, checkPermission(CAN_MANAGE),
  (req, res, next) => {
    const ct = req.headers['content-type'] || '';
    if (ct.includes('multipart')) {
      upload.fields([
        { name: 'file',  maxCount: 1  },
        { name: 'files', maxCount: 20 },
      ])(req, res, (err) => {
        if (err) return next(err);
        // Chuẩn hóa: gộp file & files vào req.files[]
        const single = req.files?.file?.[0];
        const multi  = req.files?.files || [];
        if (single) req.file  = single;
        req.files = multi.length > 0 ? multi : (single ? [single] : []);
        next();
      });
    } else {
      next();
    }
  },
  ctrl.create
);

// PUT /api/banners/:id  — cập nhật (có thể đổi ảnh qua multipart)
router.put('/:id',
  auth, checkPermission(CAN_MANAGE),
  (req, res, next) => {
    const ct = req.headers['content-type'] || '';
    if (ct.includes('multipart')) {
      upload.single('file')(req, res, next);
    } else {
      next();
    }
  },
  ctrl.update
);

// DELETE /api/banners/:id
router.delete('/:id', auth, checkPermission(CAN_MANAGE), ctrl.remove);

// PATCH /api/banners/reorder  — body: [{ id, sort_order }]
router.patch('/reorder', auth, checkPermission(CAN_MANAGE), ctrl.reorder);

module.exports = router;
