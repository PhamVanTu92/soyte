const db = require('../models');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');

const createForm = async (formData) => {
  const form = await db.Form.create(formData);
  return form;
};

const getForms = async (queryOptions) => {
  const page = parseInt(queryOptions.page, 10) || 1;
  const limit = parseInt(queryOptions.limit, 10) || 10;
  const { search, status, type } = queryOptions;
  const offset = (page - 1) * limit;

  const where = {};
  if (search) {
    where.name = { [Op.like]: `%${search}%` };
  }
  if (status) {
    where.status = status;
  }
  if (type) {
    where.type = type;
  }

  const { count, rows } = await db.Form.findAndCountAll({
    where,
    offset,
    limit,
    order: [['created_at', 'DESC']],
    paranoid: false,
  });

  return { items: rows, total: count };
};

const getFormById = async (id) => {
  const form = await db.Form.findByPk(id, { paranoid: false });
  if (!form) {
    throw new ApiError(404, 'Biểu mẫu không tồn tại');
  }
  return form;
};

const updateForm = async (id, formData) => {
  const form = await getFormById(id);
  if (!form) {
    return null;
  }
  await form.update(formData);
  return form;
};

module.exports = {
  createForm,
  getForms,
  getFormById,
  updateForm,
};
