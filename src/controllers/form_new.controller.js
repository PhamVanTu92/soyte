'use strict';
const formNewService = require('../services/form_new.service');

const getForms = async (req, res, next) => {
  try {
    const result = await formNewService.getForms(req.query);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const getFormById = async (req, res, next) => {
  try {
    const form = await formNewService.getFormById(req.params.id);
    res.json({ success: true, data: form });
  } catch (err) { next(err); }
};

const createForm = async (req, res, next) => {
  try {
    const form = await formNewService.createForm(req.body);
    res.status(201).json({ success: true, message: 'Đã tạo biểu mẫu', data: form });
  } catch (err) { next(err); }
};

const updateForm = async (req, res, next) => {
  try {
    const form = await formNewService.updateForm(req.params.id, req.body);
    res.json({ success: true, message: 'Đã cập nhật biểu mẫu', data: form });
  } catch (err) { next(err); }
};

const deleteForm = async (req, res, next) => {
  try {
    await formNewService.deleteForm(req.params.id);
    res.json({ success: true, message: 'Đã xoá biểu mẫu' });
  } catch (err) { next(err); }
};

const getFormStats = async (req, res, next) => {
  try {
    const stats = await formNewService.getFormStats(req.params.id, req.query);
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
};

module.exports = { getForms, getFormById, createForm, updateForm, deleteForm, getFormStats };
