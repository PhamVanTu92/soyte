'use strict';

const { Op } = require('sequelize');
const db = require('../models');
const ApiError = require('../utils/ApiError');

const POSITIONS = ['top', 'left', 'right', 'footer'];

// ── Lấy danh sách — có thể lọc theo position & is_active ─────────
const getBanners = async (query = {}) => {
  const { position, is_active } = query;
  const where = {};

  if (position) {
    if (!POSITIONS.includes(position)) throw new ApiError(400, `position phải là: ${POSITIONS.join(', ')}`);
    where.position = position;
  }
  if (is_active !== undefined) where.is_active = is_active === 'true' || is_active === true;

  const rows = await db.Banner.findAll({
    where,
    order: [['position', 'ASC'], ['sort_order', 'ASC'], ['id', 'ASC']],
  });

  // Nhóm theo position để FE dùng dễ hơn
  const grouped = { top: [], left: [], right: [], footer: [] };
  for (const b of rows) grouped[b.position].push(b);

  return { data: rows, grouped };
};

// ── Chi tiết ─────────────────────────────────────────────────────
const getBannerById = async (id) => {
  const banner = await db.Banner.findByPk(id);
  if (!banner) throw new ApiError(404, 'Không tìm thấy banner');
  return banner;
};

// ── Tạo mới (1 hoặc nhiều ảnh cùng lúc) ─────────────────────────
// items: [{ position, image_url, title?, link_url?, sort_order?, is_active? }]
const createBanners = async (items) => {
  if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, 'Cần ít nhất 1 banner');

  for (const item of items) {
    if (!item.position || !POSITIONS.includes(item.position)) {
      throw new ApiError(400, `position phải là: ${POSITIONS.join(', ')}`);
    }
    if (!item.image_url) throw new ApiError(400, 'image_url là bắt buộc');
  }

  const created = await db.Banner.bulkCreate(
    items.map(item => ({
      position:   item.position,
      image_url:  item.image_url,
      title:      item.title      || null,
      link_url:   item.link_url   || null,
      sort_order: item.sort_order ?? 0,
      is_active:  item.is_active  ?? true,
    })),
    { returning: true }
  );

  return created;
};

// ── Cập nhật ─────────────────────────────────────────────────────
const updateBanner = async (id, data) => {
  const banner = await db.Banner.findByPk(id);
  if (!banner) throw new ApiError(404, 'Không tìm thấy banner');

  if (data.position && !POSITIONS.includes(data.position)) {
    throw new ApiError(400, `position phải là: ${POSITIONS.join(', ')}`);
  }

  const allowed = ['position', 'image_url', 'title', 'link_url', 'sort_order', 'is_active'];
  const updates = {};
  for (const f of allowed) {
    if (data[f] !== undefined) updates[f] = data[f];
  }

  await banner.update(updates);
  return banner;
};

// ── Xóa ──────────────────────────────────────────────────────────
const deleteBanner = async (id) => {
  const banner = await db.Banner.findByPk(id);
  if (!banner) throw new ApiError(404, 'Không tìm thấy banner');
  await banner.destroy();
  return { id: parseInt(id) };
};

// ── Sắp xếp lại thứ tự trong 1 position ─────────────────────────
// orders: [{ id, sort_order }]
const reorderBanners = async (orders) => {
  if (!Array.isArray(orders) || orders.length === 0) throw new ApiError(400, 'Cần truyền mảng orders');

  await Promise.all(
    orders.map(({ id, sort_order }) =>
      db.Banner.update({ sort_order }, { where: { id } })
    )
  );
  return { updated: orders.length };
};

module.exports = { getBanners, getBannerById, createBanners, updateBanner, deleteBanner, reorderBanners };
