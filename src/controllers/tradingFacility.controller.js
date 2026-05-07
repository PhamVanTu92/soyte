'use strict';

const service = require('../services/tradingFacility.service');

const list = async (req, res, next) => {
  try {
    const result = await service.getTradingFacilities(req.query);
    res.json({ success: true, message: 'Lấy danh sách thành công', ...result });
  } catch (err) { next(err); }
};

const detail = async (req, res, next) => {
  try {
    const data = await service.getTradingFacilityById(req.params.id);
    res.json({ success: true, message: 'Lấy chi tiết thành công', data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await service.createTradingFacility(req.body);
    res.status(201).json({ success: true, message: 'Tạo cơ sở thành công', data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await service.updateTradingFacility(req.params.id, req.body);
    res.json({ success: true, message: 'Cập nhật thành công', data });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const data = await service.deleteTradingFacility(req.params.id);
    res.json({ success: true, message: 'Xóa thành công', data });
  } catch (err) { next(err); }
};

const stats = async (req, res, next) => {
  try {
    const data = await service.getTradingFacilityStats();
    res.json({ success: true, message: 'Lấy thống kê thành công', data });
  } catch (err) { next(err); }
};

module.exports = { list, detail, create, update, remove, stats };
