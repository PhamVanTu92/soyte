const { SocialFacility, Sequelize } = require('../models');
const { Op } = Sequelize;
const { success, created } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');

// Create a new facility
const create = async (req, res, next) => {
  try {
    let { id, name, type, category, address, phone, coords, description } = req.body;
    
    // Auto-generate id if not provided, based on type
    if (!id) {
      if (type) {
        const safeType = type.toString().toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 30);
        id = `${safeType}-${Date.now()}`;
      } else {
        id = `facility-${Date.now()}`;
      }
    }

    // Map coords array [lat, lng] to separate fields
    const latitude = coords && coords.length === 2 ? coords[0] : null;
    const longitude = coords && coords.length === 2 ? coords[1] : null;

    const facility = await SocialFacility.create({
      id,
      name,
      type,
      category,
      address,
      phone,
      latitude,
      longitude,
      description
    });

    return created(res, facility, 'Facility created successfully');
  } catch (err) {
    next(err);
  }
};

// Get all facilities
const getAll = async (req, res, next) => {
  try {
    const { type, search } = req.query;

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 20;

    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    const where = {};

    if (type) {
      const typeArray = Array.isArray(type)
        ? type
        : type.split(',').map(t => t.trim());

      where.type = {
        [Op.in]: typeArray
      };
    }

    if (search) {
      where.name = {
        [Op.iLike]: `%${search}%`
      };
    }

    const { count, rows } = await SocialFacility.findAndCountAll({
      where,
      offset,
      limit
    });

    // Transform data back to including coords array for FE consistency
    const data = rows.map(f => {
      const plain = f.get({ plain: true });
      plain.coords = [plain.latitude, plain.longitude];
      return plain;
    });
    const reports = await SocialFacility.count({
      group: ['type']
    });
    return success(res, data, 'Success', 200, {
      total: count,
      page,
      pageSize,
      reports,
      totalPages: Math.ceil(count / pageSize)
    });

  } catch (err) {
    next(err);
  }
};

// Get facility by ID
const getById = async (req, res, next) => {
  try {
    const facility = await SocialFacility.findByPk(req.params.id);
    if (!facility) {
      throw new ApiError(404, 'Facility not found');
    }

    const data = facility.get({ plain: true });
    data.coords = [data.latitude, data.longitude];

    return success(res, data);
  } catch (err) {
    next(err);
  }
};

// Update facility
const update = async (req, res, next) => {
  try {
    const { name, type, category, address, phone, coords, description } = req.body;
    const facility = await SocialFacility.findByPk(req.params.id);
    
    if (!facility) {
      throw new ApiError(404, 'Facility not found');
    }

    const updateData = {
      name,
      type,
      category,
      address,
      phone,
      description
    };

    if (coords && coords.length === 2) {
      updateData.latitude = coords[0];
      updateData.longitude = coords[1];
    }

    await facility.update(updateData);

    return success(res, facility, 'Facility updated successfully');
  } catch (err) {
    next(err);
  }
};

// Delete facility
const remove = async (req, res, next) => {
  try {
    const facility = await SocialFacility.findByPk(req.params.id);
    if (!facility) {
      throw new ApiError(404, 'Facility not found');
    }

    await facility.destroy();

    return success(res, null, 'Facility deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove
};
