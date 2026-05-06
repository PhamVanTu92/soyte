const { Op } = require('sequelize');
const db = require('../models');
const ApiError = require('../utils/ApiError');

const { formatPermissions, flattenPermissions } = require('../utils/permissionUtils');

const superAdmins = ['admin@gmail.com', 'admin@soyte.gov.vn'];

/**
 * Get a list of users with search and pagination
 * @param {object} queryOptions
 * @returns {Promise<{rows: User[], count: number}>}
 */
const getUsers = async (queryOptions) => {
  const { q, page = 1, limit = 10, role, unit, excludeId } = queryOptions;
  
  const where = {};
  
  if (q) {
    where[Op.or] = [
      { full_name: { [Op.like]: `%${q}%` } },
      { email: { [Op.like]: `%${q}%` } }
    ];
  }

  if (role) {
    where.role = role;
  }

  if (unit) {
    where.unit = unit;
  }

  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }

  const offset = (page - 1) * limit;

  const result = await db.User.findAndCountAll({
    where,
    distinct: true,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    attributes: ['id', 'username', 'email', 'full_name', 'role', 'status', 'unit', 'is_verified', 'type', 'created_at', 'updated_at'],
    include: [{
      model: db.Permission,
      as: 'permissions',
      attributes: ['name', 'description'],
      through: { attributes: [] }
    }],
    order: [['created_at', 'DESC']],
  });

  result.rows = result.rows.map(user => {
    const u = user.toJSON();
    const isSuperAdmin = superAdmins.includes(u.email);
    
    // Lưu thông tin chi tiết (tên + mô tả)
    u.permission_details = (u.permissions || []).map(p => ({
      name: p.name,
      description: p.description
    }));

    const permissionNames = u.permission_details.map(p => p.name);
    
    u.permission_list = permissionNames; // Danh sách phẳng (tên)
    u.permissions = formatPermissions(permissionNames, isSuperAdmin); // Cấu trúc lồng nhau
    return u;
  });

  return result;
};

/**
 * Get a single user by their ID
 * @param {number} id
 * @returns {Promise<User|null>}
 */
const getUserById = async (id) => {
  const user = await db.User.findByPk(id, {
    attributes: ['id', 'username', 'email', 'full_name', 'role', 'status', 'unit', 'is_verified', 'type', 'created_at', 'updated_at'],
    include: [{
      model: db.Permission,
      as: 'permissions',
      attributes: ['name', 'description'],
      through: { attributes: [] }
    }]
  });
  
  if (!user) {
    throw new ApiError(404, 'Người dùng không tồn tại');
  }
  const u = user.toJSON();
  const isSuperAdmin = superAdmins.includes(u.email);
  
  // Lưu thông tin chi tiết (tên + mô tả)
  u.permission_details = (u.permissions || []).map(p => ({
    name: p.name,
    description: p.description
  }));

  const permissionNames = u.permission_details.map(p => p.name);
  
  u.permission_list = permissionNames; // Danh sách phẳng
  u.permissions = formatPermissions(permissionNames, isSuperAdmin); // Cấu trúc cây
  return u;
};

/**
 * Update a user by their ID
 * @param {number} id
 * @param {object} updateData
 * @returns {Promise<[number, User[]]>}
 */
const updateUser = async (id, updateData) => {
  const { password, permissions, ...dataToUpdate } = updateData;
  
  const user = await db.User.findByPk(id);
  if (!user) {
    throw new ApiError(404, 'Người dùng không tồn tại');
  }

  await user.update(dataToUpdate);

  if (permissions) {
    let permissionArray = [];
    if (Array.isArray(permissions)) {
      permissionArray = permissions;
    } else if (typeof permissions === 'object') {
      permissionArray = flattenPermissions(permissions);
    }

    if (permissionArray.length > 0) {
      // Phân biệt Input là ID hay Name để tìm kiếm chính xác
      const isIds = typeof permissionArray[0] === 'number';
      const where = isIds ? { id: { [Op.in]: permissionArray } } : { name: { [Op.in]: permissionArray } };

      const permissionRecords = await db.Permission.findAll({ where });
      await user.setPermissions(permissionRecords);
    } else {
      // Nếu là mảng trống hoặc object trống, xóa hết quyền
      await user.setPermissions([]);
    }
  }

  return [1];
};

/**
 * Delete a user by their ID
 * @param {number} id
 * @returns {Promise<number>}
 */
const deleteUser = async (id) => {
  return db.User.destroy({
    where: { id },
  });
};

/**
 * Set permissions for a user
 * @param {number} userId
 * @param {string[]|number[]|object} permissionsInput
 * @returns {Promise<boolean>}
 */
const setUserPermissions = async (userId, permissionsInput) => {
  const user = await db.User.findByPk(userId);
  if (!user) {
    throw new ApiError(404, 'Người dùng không tồn tại');
  }

  if (permissionsInput) {
    let permissionArray = [];
    if (Array.isArray(permissionsInput)) {
      permissionArray = permissionsInput;
    } else if (typeof permissionsInput === 'object') {
      permissionArray = flattenPermissions(permissionsInput);
    }

    const isIds = permissionArray.length > 0 && typeof permissionArray[0] === 'number';
    const where = isIds ? { id: { [Op.in]: permissionArray } } : { name: { [Op.in]: permissionArray } };

    const permissionRecords = await db.Permission.findAll({ where });
    await user.setPermissions(permissionRecords);
    return true;
  }
  return false;
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  setUserPermissions,
};
