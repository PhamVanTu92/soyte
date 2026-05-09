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
    // N:N: nhiều roles qua user_roles
    model: db.Role,
    as: 'assignedRoles',
    attributes: ['id', 'name', 'description'],
    required: false,
    through: { attributes: [] },
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
 * Format user JSON: gắn roles info + effective permissions
 * - Nếu có roles → permissions = union của tất cả role permissions (không thể sửa cá nhân)
 * - Nếu không có role → permissions = user_permissions (có thể sửa)
 */
const formatUser = (user) => {
  const u = user.toJSON ? user.toJSON() : { ...user };
  const isSuperAdmin = superAdmins.includes(u.email);

  // Hỗ trợ cả N:N (assignedRoles) lẫn legacy single role (assignedRole)
  const assignedRoles = u.assignedRoles?.length
    ? u.assignedRoles
    : (u.assignedRole ? [u.assignedRole] : []);

  const hasRoles = assignedRoles.length > 0;

  // Merge tất cả role permissions (dedup by id)
  const rolePemrsMap = new Map();
  assignedRoles.forEach(r =>
    (r.permissions || []).forEach(p => rolePemrsMap.set(p.id, p))
  );
  const rolePerms = [...rolePemrsMap.values()];
  const userPerms = u.permissions || [];

  // Effective permissions = role perms nếu có role, ngược lại cá nhân
  const effectivePerms = hasRoles ? rolePerms : userPerms;
  const permNames = effectivePerms.map(p => p.name);

  return {
    ...u,
    // Danh sách roles được gán (N:N)
    assigned_roles: assignedRoles.map(r => ({ id: r.id, name: r.name, description: r.description })),
    // Backward compat: role đầu tiên
    assigned_role: assignedRoles[0]
      ? { id: assignedRoles[0].id, name: assignedRoles[0].name, description: assignedRoles[0].description }
      : null,
    // Nguồn quyền
    permission_source: hasRoles ? 'role' : 'individual',
    // Quyền hiệu lực (phẳng)
    permission_list: permNames,
    // Quyền hiệu lực (cây)
    permissions: formatPermissions(permNames, isSuperAdmin),
    // Chi tiết quyền
    permission_details: effectivePerms.map(p => ({ id: p.id, name: p.name, description: p.description })),
    // Có cho phép sửa permissions cá nhân không
    can_edit_permissions: !hasRoles,
  };
};

// ── Danh sách users ──────────────────────────────────────────────
const SAFE_SORT_COLS = {
  id: 'id', created_at: 'created_at', updated_at: 'updated_at',
  full_name: 'full_name', email: 'email', status: 'status',
};

const getUsers = async (queryOptions) => {
  const { q, page = 1, limit = 10, role, unit, excludeId, role_id, is_verified, sort_by, sort_dir } = queryOptions;

  const where = {};
  if (q) {
    where[Op.or] = [
      { full_name: { [Op.iLike]: `%${q}%` } },
      { email:     { [Op.iLike]: `%${q}%` } },
      { username:  { [Op.iLike]: `%${q}%` } },
    ];
  }
  if (role) where.role = role;
  if (unit) where.unit = unit;
  if (excludeId) where.id = { [Op.ne]: excludeId };
  if (role_id !== undefined) where.role_id = role_id === 'null' ? null : role_id;
  if (is_verified !== undefined) where.is_verified = is_verified === 'true' || is_verified === true;

  const offset = (page - 1) * limit;
  const sortCol = SAFE_SORT_COLS[sort_by] || 'created_at';
  const sortDir = sort_dir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const result = await db.User.findAndCountAll({
    where,
    distinct: true,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    attributes: USER_ATTRS,
    include: USER_INCLUDE,
    order: [[sortCol, sortDir]],
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
  const { password, permissions, role_id, role_ids, ...dataToUpdate } = updateData;

  const user = await db.User.findByPk(id, {
    include: [{ model: db.Role, as: 'assignedRoles', through: { attributes: [] }, attributes: ['id'] }],
  });
  if (!user) throw new ApiError(404, 'Người dùng không tồn tại');

  // Xử lý role_ids (N:N) hoặc role_id (legacy single)
  let newRoleIds = undefined;
  if (role_ids !== undefined) {
    newRoleIds = Array.isArray(role_ids) ? role_ids.map(Number).filter(Boolean) : [];
  } else if (role_id !== undefined) {
    newRoleIds = (role_id === null || role_id === '') ? [] : [Number(role_id)];
  }

  if (newRoleIds !== undefined) {
    if (newRoleIds.length === 0) {
      await user.setAssignedRoles([]);
      dataToUpdate.role_id = null;
    } else {
      const roles = await db.Role.findAll({ where: { id: { [Op.in]: newRoleIds } } });
      if (roles.length !== newRoleIds.length) throw new ApiError(404, 'Một hoặc nhiều role không tồn tại');
      await user.setAssignedRoles(roles);
      dataToUpdate.role_id = newRoleIds[0]; // đồng bộ legacy
    }
  }

  await user.update(dataToUpdate);

  // Xử lý permissions cá nhân
  if (permissions !== undefined) {
    const currentRoles = newRoleIds !== undefined ? newRoleIds : (user.assignedRoles || []).map(r => r.id);
    if (currentRoles.length > 0) {
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
    include: [{ model: db.Role, as: 'assignedRoles', through: { attributes: [] }, attributes: ['id', 'name'] }],
  });
  if (!user) throw new ApiError(404, 'Người dùng không tồn tại');

  if (user.assignedRoles?.length > 0) {
    const roleNames = user.assignedRoles.map(r => r.name).join(', ');
    throw new ApiError(400,
      `Người dùng đang được gán role: "${roleNames}". ` +
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

// ── Gán roles cho user (hỗ trợ 1 hoặc nhiều) ───────────────────
const assignRoleToUser = async (userId, roleIds) => {
  const user = await db.User.findByPk(userId);
  if (!user) throw new ApiError(404, 'Người dùng không tồn tại');

  // Normalize input
  let ids = [];
  if (roleIds !== null && roleIds !== undefined) {
    ids = (Array.isArray(roleIds) ? roleIds : [roleIds])
      .map(Number)
      .filter(n => !isNaN(n) && n > 0);
  }

  if (ids.length === 0) {
    await user.setAssignedRoles([]);
    await user.update({ role_id: null });
  } else {
    const roles = await db.Role.findAll({ where: { id: { [Op.in]: ids } } });
    if (roles.length !== ids.length) throw new ApiError(404, 'Một hoặc nhiều role không tồn tại');
    await user.setAssignedRoles(roles);
    await user.update({ role_id: ids[0] });
  }

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
