'use strict';

const service = require('../services/role.service');

const list = async (req, res, next) => {
  try {
    const result = await service.getRoles(req.query);
    res.json({ success: true, message: 'Lấy danh sách role thành công', ...result });
  } catch (err) { next(err); }
};

const detail = async (req, res, next) => {
  try {
    const data = await service.getRoleById(req.params.id);
    res.json({ success: true, message: 'Lấy chi tiết role thành công', data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await service.createRole(req.body);
    res.status(201).json({ success: true, message: 'Tạo role thành công', data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await service.updateRole(req.params.id, req.body);
    res.json({ success: true, message: 'Cập nhật role thành công', data });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const data = await service.deleteRole(req.params.id);
    res.json({ success: true, message: 'Xóa role thành công', data });
  } catch (err) { next(err); }
};

// PUT /api/roles/:id/permissions — gán permissions cho role
const setPermissions = async (req, res, next) => {
  try {
    const { permission_ids = [] } = req.body;
    const data = await service.setRolePermissions(req.params.id, permission_ids);
    res.json({ success: true, message: 'Cập nhật permissions của role thành công', data });
  } catch (err) { next(err); }
};

// PUT /api/roles/assign-user — gán 1 hoặc nhiều roles cho user
// Body: { user_id, role_ids: [1,2,3] }  ← ưu tiên
//       { user_id, role_id: 1 }          ← tương thích ngược (single)
//       { user_id, role_ids: [] }         ← hủy toàn bộ roles
const assignUser = async (req, res, next) => {
  try {
    const { user_id, role_id, role_ids } = req.body;
    if (!user_id) return res.status(400).json({ success: false, message: 'user_id là bắt buộc' });

    // Ưu tiên role_ids (mảng), fallback về role_id (đơn)
    let ids;
    if (role_ids !== undefined) {
      ids = role_ids; // null, [] hoặc [1,2,...]
    } else if (role_id !== undefined) {
      ids = role_id === null ? [] : [role_id];
    } else {
      ids = null; // không truyền → không thay đổi
    }

    const data = await service.assignRoleToUser(user_id, ids);
    const hasRoles = Array.isArray(data.role_ids) && data.role_ids.length > 0;
    res.json({ success: true, message: hasRoles ? 'Gán role thành công' : 'Hủy gán role thành công', data });
  } catch (err) { next(err); }
};

// GET /api/roles/user/:userId/permissions — quyền hiệu lực của user
const userEffectivePermissions = async (req, res, next) => {
  try {
    const data = await service.getUserEffectivePermissions(req.params.userId);
    res.json({ success: true, message: 'Lấy quyền hiệu lực thành công', data });
  } catch (err) { next(err); }
};

module.exports = { list, detail, create, update, remove, setPermissions, assignUser, userEffectivePermissions };
