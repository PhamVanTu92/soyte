'use strict';

const { Op } = require('sequelize');
const db = require('../models');
const ApiError = require('../utils/ApiError');

// ── Danh sách roles ──────────────────────────────────────────────
const getRoles = async (query = {}) => {
  const { search, is_active, page = 1, limit = 50 } = query;
  const where = {};
  if (search) where.name = { [Op.iLike]: `%${search}%` };
  if (is_active !== undefined) where.is_active = is_active === 'true' || is_active === true;

  const { count, rows } = await db.Role.findAndCountAll({
    where,
    include: [{
      model: db.Permission,
      as: 'permissions',
      attributes: ['id', 'name', 'description'],
      through: { attributes: [] },
    }],
    order: [['id', 'ASC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });

  return {
    data: rows,
    pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / parseInt(limit)) },
  };
};

// ── Chi tiết role ────────────────────────────────────────────────
const getRoleById = async (id) => {
  const role = await db.Role.findByPk(id, {
    include: [{
      model: db.Permission,
      as: 'permissions',
      attributes: ['id', 'name', 'description', 'parent_id'],
      through: { attributes: [] },
    }],
  });
  if (!role) throw new ApiError(404, 'Không tìm thấy role');
  return role;
};

// ── Tạo role ─────────────────────────────────────────────────────
const createRole = async ({ name, description, permission_ids = [], is_active = true }) => {
  if (!name) throw new ApiError(400, 'Tên role là bắt buộc');

  const existing = await db.Role.findOne({ where: { name } });
  if (existing) throw new ApiError(409, `Role "${name}" đã tồn tại`);

  const role = await db.Role.create({ name, description, is_active });

  if (permission_ids.length > 0) {
    const perms = await db.Permission.findAll({ where: { id: { [Op.in]: permission_ids } } });
    await role.setPermissions(perms);
  }

  return getRoleById(role.id);
};

// ── Cập nhật role ────────────────────────────────────────────────
const updateRole = async (id, { name, description, is_active, permission_ids }) => {
  const role = await db.Role.findByPk(id);
  if (!role) throw new ApiError(404, 'Không tìm thấy role');

  if (name && name !== role.name) {
    const existing = await db.Role.findOne({ where: { name, id: { [Op.ne]: id } } });
    if (existing) throw new ApiError(409, `Role "${name}" đã tồn tại`);
  }

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (is_active !== undefined) updates.is_active = is_active;
  await role.update(updates);

  // Cập nhật permissions nếu truyền vào
  if (Array.isArray(permission_ids)) {
    const perms = await db.Permission.findAll({ where: { id: { [Op.in]: permission_ids } } });
    await role.setPermissions(perms); // setPermissions thay thế toàn bộ
  }

  return getRoleById(id);
};

// ── Xóa role ─────────────────────────────────────────────────────
const deleteRole = async (id) => {
  const role = await db.Role.findByPk(id);
  if (!role) throw new ApiError(404, 'Không tìm thấy role');

  // Hủy gán role khỏi tất cả users trước khi xóa
  await db.User.update({ role_id: null }, { where: { role_id: id } });
  await role.destroy();
  return { id: parseInt(id) };
};

// ── Gắn/gỡ permissions cho role ──────────────────────────────────
const setRolePermissions = async (roleId, permission_ids) => {
  const role = await db.Role.findByPk(roleId);
  if (!role) throw new ApiError(404, 'Không tìm thấy role');

  const perms = await db.Permission.findAll({ where: { id: { [Op.in]: permission_ids } } });
  await role.setPermissions(perms);
  return getRoleById(roleId);
};

// ── Gán role cho user ────────────────────────────────────────────
const assignRoleToUser = async (userId, roleId) => {
  const user = await db.User.findByPk(userId);
  if (!user) throw new ApiError(404, 'Không tìm thấy người dùng');

  if (roleId === null || roleId === undefined) {
    await user.update({ role_id: null });
    return { user_id: userId, role_id: null };
  }

  const role = await db.Role.findByPk(roleId);
  if (!role) throw new ApiError(404, 'Không tìm thấy role');

  await user.update({ role_id: roleId });
  return { user_id: userId, role_id: roleId, role_name: role.name };
};

// ── Permissions hiệu lực của user (role + cá nhân) ───────────────
const getUserEffectivePermissions = async (userId) => {
  const user = await db.User.findByPk(userId, {
    attributes: ['id', 'full_name', 'email', 'role', 'role_id'],
    include: [
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
        include: [{
          model: db.Permission,
          as: 'permissions',
          attributes: ['id', 'name', 'description'],
          through: { attributes: [] },
        }],
      },
    ],
  });

  if (!user) throw new ApiError(404, 'Không tìm thấy người dùng');

  const rolePerms = user.assignedRole?.permissions || [];
  const userPerms = user.permissions || [];

  // Merge: role permissions + user permissions (dedup by id)
  const allPermsMap = new Map();
  rolePerms.forEach(p => allPermsMap.set(p.id, { ...p.toJSON(), source: 'role' }));
  userPerms.forEach(p => {
    if (!allPermsMap.has(p.id)) allPermsMap.set(p.id, { ...p.toJSON(), source: 'user' });
    else allPermsMap.get(p.id).source = 'both'; // nằm ở cả 2
  });

  return {
    user_id: user.id,
    full_name: user.full_name,
    email: user.email,
    system_role: user.role,
    assigned_role: user.assignedRole ? { id: user.assignedRole.id, name: user.assignedRole.name } : null,
    permissions: [...allPermsMap.values()],
    role_permissions: rolePerms,
    individual_permissions: userPerms,
  };
};

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  setRolePermissions,
  assignRoleToUser,
  getUserEffectivePermissions,
};
