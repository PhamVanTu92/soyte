'use strict';

const XLSX    = require('xlsx');
const fs      = require('fs');
const path    = require('path');
const svc     = require('../services/dataset.service');

// ── Helpers ───────────────────────────────────────────────────────

function parseExcel(filePath, sheetIndex = 0) {
  const wb    = XLSX.readFile(filePath, { cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[sheetIndex]];
  const raw   = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  let headerRow = -1;
  for (let i = 0; i < Math.min(10, raw.length); i++) {
    const row     = raw[i];
    const nonNull = row.filter(c => c !== null && c !== undefined && String(c).trim() !== '');
    if (nonNull.length >= 2 && typeof row[0] === 'string') { headerRow = i; break; }
  }
  if (headerRow === -1) throw Object.assign(new Error('Không tìm thấy hàng tiêu đề trong file Excel.'), { status: 400 });

  const fields = raw[headerRow].map(h => h !== null && h !== undefined ? String(h).trim() : null);
  const rows   = [];

  for (let i = headerRow + 1; i < raw.length; i++) {
    const row = raw[i];
    if (row.every(c => c === null || c === undefined || String(c).trim() === '')) continue;
    const obj = {};
    fields.forEach((key, j) => {
      if (!key) return;
      const val = row[j];
      obj[key]  = val === null || val === undefined ? null : String(val).trim() || null;
    });
    rows.push(obj);
  }
  return { fields: fields.filter(Boolean), rows };
}

// ── Dataset Types ─────────────────────────────────────────────────

const listDatasets = async (req, res, next) => {
  try {
    const data = await svc.listDatasets();
    res.json({ success: true, message: 'Lấy danh sách thành công', data });
  } catch (err) { next(err); }
};

const getDataset = async (req, res, next) => {
  try {
    const data = await svc.getDataset(req.params.code);
    res.json({ success: true, message: 'Lấy dataset thành công', data });
  } catch (err) { next(err); }
};

const createDataset = async (req, res, next) => {
  try {
    const data = await svc.createDataset(req.body);
    res.status(201).json({ success: true, message: 'Tạo dataset thành công', data });
  } catch (err) { next(err); }
};

const updateDataset = async (req, res, next) => {
  try {
    const data = await svc.updateDataset(req.params.code, req.body);
    res.json({ success: true, message: 'Cập nhật dataset thành công', data });
  } catch (err) { next(err); }
};

const deleteDataset = async (req, res, next) => {
  try {
    await svc.deleteDataset(req.params.code);
    res.status(204).send();
  } catch (err) { next(err); }
};

// ── Records ───────────────────────────────────────────────────────

const listRecords = async (req, res, next) => {
  try {
    const result = await svc.listRecords(req.params.code, req.query);
    res.json({ success: true, message: 'Lấy danh sách bản ghi thành công', ...result });
  } catch (err) { next(err); }
};

const getRecord = async (req, res, next) => {
  try {
    const data = await svc.getRecord(req.params.code, req.params.id);
    res.json({ success: true, message: 'Lấy bản ghi thành công', data });
  } catch (err) { next(err); }
};

const createRecord = async (req, res, next) => {
  try {
    const data = await svc.createRecord(req.params.code, req.body);
    res.status(201).json({ success: true, message: 'Tạo bản ghi thành công', data });
  } catch (err) { next(err); }
};

const updateRecord = async (req, res, next) => {
  try {
    const data = await svc.updateRecord(req.params.code, req.params.id, req.body);
    res.json({ success: true, message: 'Cập nhật bản ghi thành công', data });
  } catch (err) { next(err); }
};

const patchRecord = async (req, res, next) => {
  try {
    const data = await svc.patchRecord(req.params.code, req.params.id, req.body);
    res.json({ success: true, message: 'Cập nhật bản ghi thành công', data });
  } catch (err) { next(err); }
};

const deleteRecord = async (req, res, next) => {
  try {
    await svc.deleteRecord(req.params.code, req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
};

const truncateRecords = async (req, res, next) => {
  try {
    const data = await svc.truncateRecords(req.params.code);
    res.json({ success: true, message: 'Đã xóa toàn bộ bản ghi', data });
  } catch (err) { next(err); }
};

// ── Fields ────────────────────────────────────────────────────────

const getFields = async (req, res, next) => {
  try {
    const data = await svc.getFields(req.params.code);
    res.json({ success: true, message: 'Lấy field definitions thành công', data });
  } catch (err) { next(err); }
};

const updateFields = async (req, res, next) => {
  try {
    const data = await svc.updateFields(req.params.code, req.body);
    res.json({ success: true, message: 'Cập nhật fields thành công', data });
  } catch (err) { next(err); }
};

const detectFields = async (req, res, next) => {
  try {
    const data = await svc.detectFields(req.params.code);
    res.json({ success: true, message: 'Detect fields thành công', data });
  } catch (err) { next(err); }
};

const getFieldValues = async (req, res, next) => {
  try {
    const data = await svc.getFieldValues(req.params.code, req.params.field, req.query);
    res.json({ success: true, message: 'Lấy giá trị field thành công', data });
  } catch (err) { next(err); }
};

// ── Import Excel ──────────────────────────────────────────────────

const importExcel = async (req, res, next) => {
  const filePath = req.file?.path;
  if (!filePath) return res.status(400).json({ success: false, message: 'Thiếu file upload.' });

  try {
    const sheetIndex = parseInt(req.query.sheet_index || req.body.sheet_index) || 0;
    const truncate   = req.query.truncate === 'true' || req.body.truncate === 'true';

    const { fields, rows } = parseExcel(filePath, sheetIndex);

    const dt = await svc.getDataset(req.params.code);
    const datasetId = dt.id;

    // Xóa cũ nếu truncate
    if (truncate) await svc.truncateRecords(req.params.code);

    // Bulk insert theo batch 500
    let inserted = 0;
    const BATCH  = 500;
    for (let i = 0; i < rows.length; i += BATCH) {
      inserted += await svc.bulkInsert(datasetId, rows.slice(i, i + BATCH));
    }

    // Detect field types từ data thực
    const detectedFields = await svc.detectFieldsFromData(datasetId);
    await svc.updateDataset(req.params.code, { fields: detectedFields, source_file: req.file.originalname });

    res.json({
      success: true,
      message: `Import thành công.`,
      data: { dataset: req.params.code, fields, inserted, truncated: truncate },
    });
  } catch (err) {
    next(err);
  } finally {
    if (filePath) fs.unlink(filePath, () => {});
  }
};

// ── Export Excel ──────────────────────────────────────────────────

const exportExcel = async (req, res, next) => {
  try {
    const dt      = await svc.getDataset(req.params.code);
    const result  = await svc.listRecords(req.params.code, { limit: 10000 });
    const records = result.data;

    if (!records.length) return res.status(404).json({ success: false, message: 'Không có dữ liệu để xuất.' });

    let headers;
    if (dt.fields && Array.isArray(dt.fields)) {
      headers = dt.fields.map(f => (typeof f === 'string' ? f : f.name)).filter(Boolean);
    } else {
      const allKeys = new Set();
      records.forEach(row => Object.keys(row.data || row).forEach(k => allKeys.add(k)));
      headers = [...allKeys];
    }

    const sheetData = [
      headers,
      ...records.map(row => headers.map(h => (row.data || row)[h] ?? null)),
    ];

    const wb  = XLSX.utils.book_new();
    const ws  = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, (dt.name || dt.code).substring(0, 31));

    const buf      = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = encodeURIComponent(`${req.params.code}_export_${Date.now()}.xlsx`);

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) { next(err); }
};

// ── Stats ─────────────────────────────────────────────────────────

const getDatasetStats   = async (req, res, next) => {
  try {
    const data = await svc.getDatasetStats(req.params.code);
    res.json({ success: true, message: 'Thống kê thành công', data });
  } catch (err) { next(err); }
};

const getSystemStats = async (req, res, next) => {
  try {
    const data = await svc.getSystemStats();
    res.json({ success: true, message: 'Thống kê hệ thống thành công', data });
  } catch (err) { next(err); }
};

module.exports = {
  listDatasets, getDataset, createDataset, updateDataset, deleteDataset,
  listRecords, getRecord, createRecord, updateRecord, patchRecord, deleteRecord,
  truncateRecords,
  getFields, updateFields, detectFields, getFieldValues,
  importExcel, exportExcel,
  getDatasetStats, getSystemStats,
};
