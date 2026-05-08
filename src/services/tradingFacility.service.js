'use strict';

const { Op } = require('sequelize');
const db = require('../models');
const ApiError = require('../utils/ApiError');

// ── List với filter + phân trang ────────────────────────────────
const getTradingFacilities = async (query) => {
  const {
    page = 1, limit = 20,
    search, trading_type, facility_type, is_active,
    sort_by = 'id', sort_order = 'ASC',
  } = query;

  const where = {};

  // Exact match — giá trị đến từ lookup table nên không cần tìm mờ
  if (trading_type) where.trading_type = trading_type;
  if (facility_type) where.facility_type = facility_type;
  if (is_active !== undefined) where.is_active = is_active === 'true' || is_active === true;

  if (search) {
    where[Op.or] = [
      { name:               { [Op.iLike]: `%${search}%` } },
      { certificate_number: { [Op.iLike]: `%${search}%` } },
      { person_in_charge:   { [Op.iLike]: `%${search}%` } },
      { address:            { [Op.iLike]: `%${search}%` } },
      { gps_number:         { [Op.iLike]: `%${search}%` } },
    ];
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const validSortBy = ['id', 'name', 'trading_type', 'facility_type', 'issue_date', 'created_at'];
  const orderCol = validSortBy.includes(sort_by) ? sort_by : 'id';
  const orderDir = sort_order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  const { count, rows } = await db.TradingFacility.findAndCountAll({
    where,
    order: [[orderCol, orderDir]],
    limit: parseInt(limit),
    offset,
  });

  return {
    data: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit)),
    },
  };
};

// ── Chi tiết ────────────────────────────────────────────────────
const getTradingFacilityById = async (id) => {
  const facility = await db.TradingFacility.findByPk(id);
  if (!facility) throw new ApiError(404, 'Không tìm thấy cơ sở');
  return facility;
};

// ── Thêm mới ────────────────────────────────────────────────────
const createTradingFacility = async (data) => {
  const {
    certificate_number, name, person_in_charge, practice_certificate,
    facility_type, trading_type, address, issue_date, gps_number, gps_issue_date,
    is_active = true,
  } = data;

  if (!name) throw new ApiError(400, 'Tên cơ sở là bắt buộc');
  if (!trading_type) throw new ApiError(400, 'trading_type là bắt buộc');

  // Kiểm tra trading_type hợp lệ (có trong lookup)
  await validateOptionValue('trading_type', trading_type);
  if (facility_type) await validateOptionValue('facility_type', facility_type);

  return db.TradingFacility.create({
    certificate_number, name, person_in_charge, practice_certificate,
    facility_type, trading_type, address, issue_date, gps_number, gps_issue_date,
    is_active,
  });
};

// ── Cập nhật ────────────────────────────────────────────────────
const updateTradingFacility = async (id, data) => {
  const facility = await db.TradingFacility.findByPk(id);
  if (!facility) throw new ApiError(404, 'Không tìm thấy cơ sở');

  const allowedFields = [
    'certificate_number', 'name', 'person_in_charge', 'practice_certificate',
    'facility_type', 'trading_type', 'address', 'issue_date',
    'gps_number', 'gps_issue_date', 'is_active',
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) updates[field] = data[field];
  }

  if (updates.trading_type) await validateOptionValue('trading_type', updates.trading_type);
  if (updates.facility_type) await validateOptionValue('facility_type', updates.facility_type);

  await facility.update(updates);
  return facility;
};

// ── Xóa ─────────────────────────────────────────────────────────
const deleteTradingFacility = async (id) => {
  const facility = await db.TradingFacility.findByPk(id);
  if (!facility) throw new ApiError(404, 'Không tìm thấy cơ sở');
  await facility.destroy();
  return { id: parseInt(id) };
};

// ── Thống kê nhanh ───────────────────────────────────────────────
const getTradingFacilityStats = async () => {
  const [total, active] = await Promise.all([
    db.TradingFacility.count(),
    db.TradingFacility.count({ where: { is_active: true } }),
  ]);

  const byTradingType = await db.TradingFacility.findAll({
    attributes: ['trading_type', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
    group: ['trading_type'],
    order: [[db.sequelize.literal('count'), 'DESC']],
    raw: true,
  });

  const byFacilityType = await db.TradingFacility.findAll({
    attributes: ['facility_type', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
    group: ['facility_type'],
    order: [[db.sequelize.literal('count'), 'DESC']],
    raw: true,
  });

  return { total, active, inactive: total - active, byTradingType, byFacilityType };
};

// ════════════════════════════════════════════════════════════════
// CRUD cho Options (facility_type / trading_type)
// ════════════════════════════════════════════════════════════════

/**
 * Lấy toàn bộ options, nhóm theo kind
 * ?kind=facility_type  → chỉ lấy 1 loại
 */
const getOptions = async (query = {}) => {
  const where = {};
  if (query.kind) where.kind = query.kind;

  const rows = await db.TradingFacilityOption.findAll({
    where,
    order: [['kind', 'ASC'], ['label', 'ASC']],
  });

  // Nhóm theo kind để FE dùng dễ hơn
  const grouped = {};
  for (const row of rows) {
    if (!grouped[row.kind]) grouped[row.kind] = [];
    grouped[row.kind].push(row);
  }

  return { data: rows, grouped };
};

/**
 * Thêm option mới
 * body: { kind, value, label }
 */
const createOption = async (body) => {
  const { kind, value, label } = body;
  if (!kind || !value || !label) throw new ApiError(400, 'kind, value, label là bắt buộc');
  if (!['facility_type', 'trading_type'].includes(kind)) {
    throw new ApiError(400, 'kind phải là "facility_type" hoặc "trading_type"');
  }

  const existing = await db.TradingFacilityOption.findOne({ where: { kind, value } });
  if (existing) throw new ApiError(409, `Giá trị "${value}" đã tồn tại trong ${kind}`);

  return db.TradingFacilityOption.create({ kind, value, label });
};

/**
 * Sửa option
 * body: { label } — chỉ cho sửa label, không cho sửa value (vì dữ liệu cũ dùng value)
 */
const updateOption = async (id, body) => {
  const option = await db.TradingFacilityOption.findByPk(id);
  if (!option) throw new ApiError(404, 'Không tìm thấy option');

  const updates = {};
  if (body.label !== undefined) updates.label = body.label;
  // Cho phép sửa value nếu không có facility nào đang dùng
  if (body.value !== undefined && body.value !== option.value) {
    const inUse = await db.TradingFacility.count({ where: { [option.kind]: option.value } });
    if (inUse > 0) {
      throw new ApiError(409, `Không thể đổi value: có ${inUse} cơ sở đang dùng giá trị này`);
    }
    updates.value = body.value;
  }

  await option.update(updates);
  return option;
};

/**
 * Xóa option — chỉ được xóa nếu chưa có cơ sở nào dùng
 */
const deleteOption = async (id) => {
  const option = await db.TradingFacilityOption.findByPk(id);
  if (!option) throw new ApiError(404, 'Không tìm thấy option');

  const inUse = await db.TradingFacility.count({ where: { [option.kind]: option.value } });
  if (inUse > 0) {
    throw new ApiError(409, `Không thể xóa: có ${inUse} cơ sở đang dùng loại hình này`);
  }

  await option.destroy();
  return { id: parseInt(id) };
};

// ── Helper: kiểm tra value có trong lookup không ────────────────
const validateOptionValue = async (kind, value) => {
  const opt = await db.TradingFacilityOption.findOne({ where: { kind, value } });
  if (!opt) throw new ApiError(400, `Giá trị "${value}" không hợp lệ cho ${kind}. Vui lòng chọn từ danh sách.`);
};

module.exports = {
  getTradingFacilities,
  getTradingFacilityById,
  createTradingFacility,
  updateTradingFacility,
  deleteTradingFacility,
  getTradingFacilityStats,
  getOptions,
  createOption,
  updateOption,
  deleteOption,
};
