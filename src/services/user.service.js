const { Op } = require('sequelize');
const db = require('../models');
const ApiError = require('../utils/ApiError');

const { formatPermissions, flattenPermissions } = require('../utils/permissionUtils');

const superAdmins = ['admin@gmail.com', 'admin@soyte.gov.vn'];

// ── Include chuẩn cho user query ────────────────────────────────
const USER_INCLUDE = [
  {
    model: db.Permission,
    as: 'permissions',
    attributes: ['id', 'name', 'description'],
    through: { attributes: [] },
  },
  {
    model: db.Role,
    as: 'assignedRole',
    attributes: ['id', 'name', 'description'],
    required: false,
    include: [{
      model: db.Permission,
      as: 'permissions',
      attributes: ['id', 'name', 'description'],
      through: { attributes: [] },
    }],
  },
];

const USER_ATTRS = [
  'id', 'username', 'email', 'full_name', 'role', 'role_id',
  'status', 'unit', 'is_verified', 'type', 'created_at', 'updated_at',
];

/**
 * Format user JSON: gắn role info + effective permissions
 * - Nếu có role → permissions = role.permissions (không thể sửa cá nhân)
 * - Nếu không có role → permissions = user_permissions (có thể sửa)
 */
const formatUser = (user) => {
  const u = user.toJSON ? user.toJSON() : { ...user };
  const isSuperAdmin = superAdmins.includes(u.email);

  const rolePerms   = u.assignedRole?.permissions || [];
  const userPerms   = u.permissions || [];
  const hasRole     = !!u.assignedRole;

  // Effective permissions = role permissions (nếu có role) + cá nhân chỉ dùng khi không có role
  const effectivePerms = hasRole ? rolePerms : userPerms;
  const permNames = effectivePerms.map(p => p.name);

  return {
    ...u,
    // Thông tin role được gán
    assigned_role: u.assignedRole
      ? { id: u.assignedRole.id, name: u.assignedRole.name, description: u.assignedRole.description }
      : null,
    // Nguồn quyền
    permission_source: hasRole ? 'role' : 'individual',
    // Quyền hiệu lực (phẳng)
    permission_list: permNames,
    // Quyền hiệu lực (cây)
    permissions: formatPermissions(permNames, isSuperAdmin),
    // Chi tiết quyền
    permission_details: effectivePerms.map(p => ({ id: p.id, name: p.name, description: p.description })),
    // Có cho phép sửa permissions cá nhân không
    can_edit_permissions: !hasRole,
  };
};

// ── Danh sách users ──────────────────────────────────────────────
const getUsers = async (queryOptions) => {
  const { q, page = 1, limit = 10, role, unit, excludeId, role_id } = queryOptions;

  const where = {};
  if (q) {
    where[Op.or] = [
      { full_name: { [Op.like]: `%${q}%` } },
      { email: { [Op.like]: `%${q}%` } },
    ];
  }
  if (role) where.role = role;
  if (unit) where.unit = unit;
  if (excludeId) where.id = { [Op.ne]: excludeId };
  if (role_id !== undefined) where.role_id = role_id === 'null' ? null : role_id;

  const offset = (page - 1) * limit;

  const result = await db.User.findAndCountAll({
    where,
    distinct: true,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    attributes: USER_ATTRS,
    include: USER_INCLUDE,
    order: [['created_at', 'DESC']],
  });

  result.rows = result.rows.map(formatUser);
  return result;
};

// ── Chi tiết user ────────────────────────────────────────────────
const getUserById = async (id) => {
  const user = await db.User.findByPk(id, {
    attributes: USER_ATTRS,
    include: USER_INCLUDE,
  });

  if (!user) throw new ApiError(404, 'Người dùng không tồn tại');
  return formatUser(user);
};

// ── Cập nhật user ────────────────────────────────────────────────
const updateUser = async (id, updateData) => {
  const { password, permissions, role_id, ...dataToUpdate } = updateData;

  const user = await db.User.findByPk(id, {
    include: [{ model: db.Role, as: 'assignedRole', attributes: ['id'] }],
  });
  if (!user) throw new ApiError(404, 'Người dùng không tồn tại');

  // Xử lý role_id (gán / hủy gán role)
  if (role_id !== undefined) {
    if (role_id === null || role_id === '') {
      dataToUpdate.role_id = null;
    } else {
      const role = await db.Role.findByPk(role_id);
      if (!role) throw new ApiError(404, 'Role không tồn tại');
      dataToUpdate.role_id = role_id;
    }
  }

  await user.update(dataToUpdate);

  // Xử lý permissions cá nhân
  if (permissions !== undefined) {
    // Reload để có role_id mới nhất
    const currentRoleId = dataToUpdate.role_id !== undefined ? dataToUpdate.role_id : user.role_id;
    if (currentRoleId) {
      throw new ApiError(400, 'Không thể chỉnh sửa permissions cá nhân khi user đang được gán role. Hãy thay đổi permissions của role hoặc hủy gán role trước.');
    }

    let permissionArray = [];
    if (Array.isArray(permissions)) {
      permissionArray = permissions;
    } else if (typeof permissions === 'object') {
      permissionArray = flattenPermissions(permissions);
    }

    if (permissionArray.length > 0) {
      const isIds = typeof permissionArray[0] === 'number';
      const where = isIds
        ? { id: { [Op.in]: permissionArray } }
        : { name: { [Op.in]: permissionArray } };
      const records = await db.Permission.findAll({ where });
      await user.setPermissions(records);
    } else {
      await user.setPermissions([]);
    }
  }

  return [1];
};

// ── Xóa user ─────────────────────────────────────────────────────
const deleteUser = async (id) => {
  return db.User.destroy({ where: { id } });
};

// ── Gán permissions cá nhân (chỉ khi không có role) ─────────────
const setUserPermissions = async (userId, permissionsInput) => {
  const user = await db.User.findByPk(userId, {
    include: [{ model: db.Role, as: 'assignedRole', attributes: ['id', 'name'] }],
  });
  if (!user) throw new ApiError(404, 'Người dùng không tồn tại');

  if (user.assignedRole) {
    throw new ApiError(400,
      `Người dùng đang được gán role "${user.assignedRole.name}". ` +
      `Permissions được quản lý qua role — hãy chỉnh sửa permissions của role hoặc hủy gán role trước.`
    );
  }

  let permissionArray = [];
  if (Array.isArray(permissionsInput)) {
    permissionArray = permissionsInput;
  } else if (typeof permissionsInput === 'object') {
    permissionArray = flattenPermissions(permissionsInput);
  }

  const isIds = permissionArray.length > 0 && typeof permissionArray[0] === 'number';
  const where = isIds
    ? { id: { [Op.in]: permissionArray } }
    : { name: { [Op.in]: permissionArray } };

  const records = await db.Permission.findAll({ where });
  await user.setPermissions(records);
  return true;
};

// ── Gán role cho user ────────────────────────────────────────────
const assignRoleToUser = async (userId, roleId) => {
  const user = await db.User.findByPk(userId);
  if (!user) throw new ApiError(404, 'Người dùng không tồn tại');

  if (roleId === null || roleId === undefined || roleId === '') {
    await user.update({ role_id: null });
    return getUserById(userId);
  }

  const role = await db.Role.findByPk(roleId);
  if (!role) throw new ApiError(404, 'Role không tồn tại');

  await user.update({ role_id: roleId });
  return getUserById(userId);
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  setUserPermissions,
  assignRoleToUser,
};
