const formService = require('../services/form.service');
const ApiError = require('../utils/ApiError');

const createForm = async (req, res, next) => {
  try {
    const form = await formService.createForm(req.body);
    res.status(201).json({ success: true, message: 'Form created successfully', data: form });
  } catch (error) {
    next(error);
  }
};

const getForms = async (req, res, next) => {
  try {
    const result = await formService.getForms(req.query);
    res.status(200).json({ success: true, message: 'Forms retrieved successfully', data: result });
  } catch (error) {
    next(error);
  }
};

const getFormById = async (req, res, next) => {
  try {
    const form = await formService.getFormById(req.params.id);
    if (!form) {
      throw new ApiError(404, 'Form not found');
    }
    res.status(200).json({ success: true, message: 'Form retrieved successfully', data: form });
  } catch (error) {
    next(error);
  }
};

const updateForm = async (req, res, next) => {
  try {
    const form = await formService.updateForm(req.params.id, req.body);
    if (!form) {
      return res.status(404).json({ success: false, message: 'Form not found' });
    }
    res.status(200).json({ success: true, message: 'Form updated successfully', data: form });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createForm,
  getForms,
  getFormById,
  updateForm,
};
