'use strict';

const express = require('express');
const multer  = require('multer');
const os      = require('os');
const path    = require('path');
const router  = express.Router();
const ctrl    = require('../controllers/dataset.controller');
const { verifyToken: auth }    = require('../middlewares/auth.middleware');
const { checkPermission }      = require('../middlewares/checkPermission.middleware');

// ── Multer — Excel upload (lưu vào temp dir) ─────────────────────
const excelUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, os.tmpdir()),
    filename:    (_req, file, cb) => {
      const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, suffix + path.extname(file.originalname).toLowerCase());
    },
  }),
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xls', '.xlsx'].includes(ext)) return cb(null, true);
    cb(new Error('Chỉ chấp nhận file Excel (.xls, .xlsx).'), false);
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// Permission keys cho dataset
const DS_PERM = ['dataset', 'dataset.manage'];

// ── Dataset Types ─────────────────────────────────────────────────
// GET    /api/datasets
router.get('/',          auth, checkPermission(DS_PERM), ctrl.listDatasets);

// POST   /api/datasets
router.post('/',         auth, checkPermission(DS_PERM), ctrl.createDataset);

// GET    /api/datasets/stats  (trước /:code để không bị match nhầm)
router.get('/stats',     auth, checkPermission(DS_PERM), ctrl.getSystemStats);

// GET    /api/datasets/:code
router.get('/:code',     auth, checkPermission(DS_PERM), ctrl.getDataset);

// PUT    /api/datasets/:code
router.put('/:code',     auth, checkPermission(DS_PERM), ctrl.updateDataset);

// DELETE /api/datasets/:code
router.delete('/:code',  auth, checkPermission(DS_PERM), ctrl.deleteDataset);

// ── Records ───────────────────────────────────────────────────────
// GET    /api/datasets/:code/records
router.get('/:code/records',          auth, checkPermission(DS_PERM), ctrl.listRecords);

// POST   /api/datasets/:code/records
router.post('/:code/records',         auth, checkPermission(DS_PERM), ctrl.createRecord);

// DELETE /api/datasets/:code/records  (truncate)
router.delete('/:code/records',       auth, checkPermission(DS_PERM), ctrl.truncateRecords);

// GET    /api/datasets/:code/records/:id
router.get('/:code/records/:id',      auth, checkPermission(DS_PERM), ctrl.getRecord);

// PUT    /api/datasets/:code/records/:id
router.put('/:code/records/:id',      auth, checkPermission(DS_PERM), ctrl.updateRecord);

// PATCH  /api/datasets/:code/records/:id
router.patch('/:code/records/:id',    auth, checkPermission(DS_PERM), ctrl.patchRecord);

// DELETE /api/datasets/:code/records/:id
router.delete('/:code/records/:id',   auth, checkPermission(DS_PERM), ctrl.deleteRecord);

// ── Fields ────────────────────────────────────────────────────────
// GET    /api/datasets/:code/fields
router.get('/:code/fields',                    auth, checkPermission(DS_PERM), ctrl.getFields);

// PUT    /api/datasets/:code/fields
router.put('/:code/fields',                    auth, checkPermission(DS_PERM), ctrl.updateFields);

// POST   /api/datasets/:code/fields/detect
router.post('/:code/fields/detect',            auth, checkPermission(DS_PERM), ctrl.detectFields);

// GET    /api/datasets/:code/fields/:field/values
router.get('/:code/fields/:field/values',      auth, checkPermission(DS_PERM), ctrl.getFieldValues);

// ── Import / Export ───────────────────────────────────────────────
// POST   /api/datasets/:code/import  (multipart/form-data, field: "file")
router.post('/:code/import',
  auth, checkPermission(DS_PERM),
  excelUpload.single('file'),
  ctrl.importExcel
);

// GET    /api/datasets/:code/export
router.get('/:code/export',   auth, checkPermission(DS_PERM), ctrl.exportExcel);

// ── Stats ─────────────────────────────────────────────────────────
// GET    /api/datasets/:code/stats
router.get('/:code/stats',    auth, checkPermission(DS_PERM), ctrl.getDatasetStats);

module.exports = router;
