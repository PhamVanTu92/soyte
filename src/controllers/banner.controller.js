'use strict';

const service = require('../services/banner.service');
const { buildUploadUrl } = require('../utils/urlHelper');

// GET /api/banners?position=top&is_active=true
const list = async (req, res, next) => {
  try {
    const result = await service.getBanners(req.query);
    res.json({ success: true, message: 'Lấy danh sách banner thành công', ...result });
  } catch (err) { next(err); }
};

// GET /api/banners/:id
const detail = async (req, res, next) => {
  try {
    const data = await service.getBannerById(req.params.id);
    res.json({ success: true, message: 'Lấy banner thành công', data });
  } catch (err) { next(err); }
};

// POST /api/banners
// Hỗ trợ 2 cách:
//   1. multipart/form-data với file[] (upload nhiều ảnh cùng lúc)
//   2. application/json với { items: [...] } hoặc { position, image_url, ... }
const create = async (req, res, next) => {
  try {
    let items = [];

    if (req.files && req.files.length > 0) {
      // Upload trực tiếp nhiều file
      const { position, title, link_url, sort_order, is_active } = req.body;
      items = req.files.map((file, idx) => {
        const subPath = file.destination.replace(/^uploads\/?/, '').replace(/\/?$/, '/');
        const image_url = buildUploadUrl(`/uploads/${subPath}${file.filename}`);
        return {
          position,
          image_url,
          title:      title      || null,
          link_url:   link_url   || null,
          sort_order: parseInt(sort_order || idx),
          is_active:  is_active !== 'false',
        };
      });
    } else if (req.file) {
      // Upload 1 file
      const { position, title, link_url, sort_order, is_active } = req.body;
      const subPath = req.file.destination.replace(/^uploads\/?/, '').replace(/\/?$/, '/');
      const image_url = buildUploadUrl(`/uploads/${subPath}${req.file.filename}`);
      items = [{ position, image_url, title, link_url, sort_order: parseInt(sort_order || 0), is_active: is_active !== 'false' }];
    } else {
      // JSON body
      const body = req.body;
      items = Array.isArray(body.items) ? body.items : [body];
    }

    const data = await service.createBanners(items);
    res.status(201).json({ success: true, message: `Tạo ${data.length} banner thành công`, data });
  } catch (err) { next(err); }
};

// PUT /api/banners/:id  — JSON hoặc multipart (đổi ảnh)
const update = async (req, res, next) => {
  try {
    let body = { ...req.body };

    if (req.file) {
      const subPath = req.file.destination.replace(/^uploads\/?/, '').replace(/\/?$/, '/');
      body.image_url = buildUploadUrl(`/uploads/${subPath}${req.file.filename}`);
    }

    const data = await service.updateBanner(req.params.id, body);
    res.json({ success: true, message: 'Cập nhật banner thành công', data });
  } catch (err) { next(err); }
};

// DELETE /api/banners/:id
const remove = async (req, res, next) => {
  try {
    const data = await service.deleteBanner(req.params.id);
    res.json({ success: true, message: 'Xóa banner thành công', data });
  } catch (err) { next(err); }
};

// PATCH /api/banners/reorder  — sắp xếp lại thứ tự
// body: [{ id, sort_order }, ...]
const reorder = async (req, res, next) => {
  try {
    const data = await service.reorderBanners(req.body);
    res.json({ success: true, message: 'Sắp xếp thành công', data });
  } catch (err) { next(err); }
};

module.exports = { list, detail, create, update, remove, reorder };
