const userService = require('../services/user.service');
const { success } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');

const getUsers = async (req, res, next) => {
  try {
    const result = await userService.getUsers({ ...req.query, excludeId: req.user.id });
    return success(res, result.rows, 'Users retrieved successfully', 200, {
      total: result.count,
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      totalPages: Math.ceil(result.count / (parseInt(req.query.limit, 10) || 10)),
    });
  } catch (error) { next(error); }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return success(res, user, 'User retrieved successfully');
  } catch (error) { next(error); }
};

const updateUser = async (req, res, next) => {
  try {
    const userIdToUpdate = req.params.id;
    const loggedInUser = req.user;

    if (loggedInUser.role !== 'admin' && loggedInUser.id.toString() !== userIdToUpdate) {
      throw new ApiError(403, 'Forbidden: You can only update your own information.');
    }

    // Non-admin không được đổi role/role_id/permissions
    if (loggedInUser.role !== 'admin') {
      delete req.body.role;
      delete req.body.role_id;
      delete req.body.permissions;
    }

    const [affectedRows] = await userService.updateUser(userIdToUpdate, req.body);
    if (affectedRows === 0) throw new ApiError(404, 'User not found');

    const updatedUser = await userService.getUserById(userIdToUpdate);
    return success(res, updatedUser, 'User updated successfully');
  } catch (error) { next(error); }
};

const deleteUser = async (req, res, next) => {
  try {
    const affectedRows = await userService.deleteUser(req.params.id);
    if (affectedRows === 0) throw new ApiError(404, 'User not found');
    return success(res, null, 'User deleted successfully');
  } catch (error) { next(error); }
};

/**
 * Gán permissions cá nhân cho user.
 * Bị block nếu user đang có role (trả 400 với message rõ ràng).
 */
const assignPermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      throw new ApiError(400, 'permissions phải là mảng');
    }

    await userService.setUserPermissions(id, permissions);
    const updatedUser = await userService.getUserById(id);
    return success(res, updatedUser, 'Permissions assigned successfully');
  } catch (error) { next(error); }
};

/**
 * Gán / hủy gán role cho user (admin only).
 * PUT /api/users/:id/role
 * body: { role_id: number | null }
 */
const assignRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role_id } = req.body;

    const updatedUser = await userService.assignRoleToUser(id, role_id ?? null);
    const msg = role_id
      ? `Đã gán role cho người dùng thành công`
      : `Đã hủy gán role khỏi người dùng`;
    return success(res, updatedUser, msg);
  } catch (error) { next(error); }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  assignPermissions,
  assignRole,
};
