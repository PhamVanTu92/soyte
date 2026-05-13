const { AffiliatedFacility } = require('../models');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/apiResponse');
const { Op } = require('sequelize');

exports.getAll = async (req, res, next) => {
    try {
      const { q } = req.query;
      const page = parseInt(req.query.page, 10) || 1;
      const pageSize = parseInt(req.query.pageSize, 10) || 20;
      const offset = (page - 1) * pageSize;
      const limit = pageSize;
  
      const where = {};
      if (q && q.trim() !== '') {
        where.name = { [Op.like]: `%${q}%` };
      }
  
      const { count, rows } = await AffiliatedFacility.findAndCountAll({
        where,
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });
  
      return success(res, rows, 'Success', 200, {
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
      });
    } catch (error) {
      next(error);
    }
  };

exports.getById = async (req, res, next) => {
    try {
        const facility = await AffiliatedFacility.findByPk(req.params.id);
        if (!facility) {
            throw new ApiError(404, 'Không tìm thấy cơ sở y tế');
        }
        res.status(200).json({ success: true, message: 'Lấy thông tin cơ sở y tế thành công', data: facility });
    } catch (error) {
        next(error);
    }
};

exports.create = async (req, res, next) => {
    try {
        const { name, logo } = req.body;
        const newFacility = await AffiliatedFacility.create({ name, logo });
        res.status(201).json({ success: true, message: 'Thêm mới cơ sở y tế thành công', data: newFacility });
    } catch (error) {
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const { name, logo } = req.body;
        const facility = await AffiliatedFacility.findByPk(req.params.id);
        if (!facility) {
            throw new ApiError(404, 'Không tìm thấy cơ sở y tế');
        }
        await facility.update({ name, logo });
        res.status(200).json({ success: true, message: 'Cập nhật cơ sở y tế thành công', data: facility });
    } catch (error) {
        next(error);
    }
};

exports.delete = async (req, res, next) => {
    try {
        const facility = await AffiliatedFacility.findByPk(req.params.id);
        if (!facility) {
            throw new ApiError(404, 'Không tìm thấy cơ sở y tế');
        }
        await facility.destroy();
        res.status(200).json({ success: true, message: 'Xoá cơ sở y tế thành công' });
    } catch (error) {
        next(error);
    }
};
