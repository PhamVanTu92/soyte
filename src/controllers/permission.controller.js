const permissionService = require('../services/permission.service');
const ApiError = require('../utils/ApiError');

/**
 * Get all permissions
 */
const getAllPermissions = async (req, res, next) => {
  try {
    const permissions = await permissionService.getPermissions();
    res.status(200).json({
      message: 'Danh sách quyền đã được lấy thành công',
      permissions: permissions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get permission by ID
 */
const getPermissionById = async (req, res, next) => {
  try {
    const permission = await permissionService.getPermissionById(req.params.id);
    if (!permission) {
      throw new ApiError(404, 'Không tìm thấy quyền này');
    }
    res.status(200).json({
      message: 'Lấy chi tiết quyền thành công',
      permission: permission,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new permission
 */
const createPermission = async (req, res, next) => {
  try {
    const permission = await permissionService.createPermission(req.body);
    res.status(201).json({
      message: 'Tạo quyền mới thành công',
      permission: permission,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update permission
 */
const updatePermission = async (req, res, next) => {
  try {
    const permission = await permissionService.updatePermission(req.params.id, req.body);
    if (!permission) {
      throw new ApiError(404, 'Không tìm thấy quyền để cập nhật');
    }
    res.status(200).json({
      message: 'Cập nhật quyền thành công',
      permission: permission,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete permission
 */
const deletePermission = async (req, res, next) => {
  try {
    const result = await permissionService.deletePermission(req.params.id);
    if (!result) {
      throw new ApiError(404, 'Không tìm thấy quyền để xóa');
    }
    res.status(200).json({
      message: 'Xóa quyền thành công',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
};
