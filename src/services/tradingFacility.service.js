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

  if (trading_type) where.trading_type = trading_type;
  if (facility_type) where.facility_type = { [Op.iLike]: `%${facility_type}%` };
  if (is_active !== undefined) where.is_active = is_active === 'true' || is_active === true;

  if (search) {
    where[Op.or] = [
      { name:                { [Op.iLike]: `%${search}%` } },
      { certificate_number:  { [Op.iLike]: `%${search}%` } },
      { person_in_charge:    { [Op.iLike]: `%${search}%` } },
      { address:             { [Op.iLike]: `%${search}%` } },
      { gps_number:          { [Op.iLike]: `%${search}%` } },
    ];
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const validSortBy = ['id','name','trading_type','facility_type','issue_date','created_at'];
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
  if (!trading_type || !['wholesale', 'retail'].includes(trading_type)) {
    throw new ApiError(400, 'trading_type phải là "wholesale" hoặc "retail"');
  }

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

  if (updates.trading_type && !['wholesale', 'retail'].includes(updates.trading_type)) {
    throw new ApiError(400, 'trading_type phải là "wholesale" hoặc "retail"');
  }

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
  const [total, wholesale, retail, active] = await Promise.all([
    db.TradingFacility.count(),
    db.TradingFacility.count({ where: { trading_type: 'wholesale' } }),
    db.TradingFacility.count({ where: { trading_type: 'retail' } }),
    db.TradingFacility.count({ where: { is_active: true } }),
  ]);

  const byType = await db.TradingFacility.findAll({
    attributes: ['facility_type', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
    group: ['facility_type'],
    order: [[db.sequelize.literal('count'), 'DESC']],
    raw: true,
  });

  return { total, wholesale, retail, active, inactive: total - active, byType };
};

module.exports = {
  getTradingFacilities,
  getTradingFacilityById,
  createTradingFacility,
  updateTradingFacility,
  deleteTradingFacility,
  getTradingFacilityStats,
};
