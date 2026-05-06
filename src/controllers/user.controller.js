const userService = require('../services/user.service');
const { success } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Get all users with pagination and search
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getUsers = async (req, res, next) => {
  try {
    const result = await userService.getUsers({ ...req.query, excludeId: req.user.id });
    
    // Result rows are already JSON objects from the service (formatted with hierarchical permissions)
    const users = result.rows;

    return success(res, users, 'Users retrieved successfully', 200, {
        total: result.count,
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 10,
        totalPages: Math.ceil(result.count / (parseInt(req.query.limit, 10) || 10)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return success(res, user, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a user's information
 * @route   PUT /api/users/:id
 * @access  Private
 */
const updateUser = async (req, res, next) => {
  try {
    const userIdToUpdate = req.params.id;
    const loggedInUser = req.user;

    // A user can update their own info, or an admin can update any user's info
    if (loggedInUser.role !== 'admin' && loggedInUser.id.toString() !== userIdToUpdate) {
      throw new ApiError(403, 'Forbidden: You can only update your own information.');
    }
    
    // Prevent non-admins from changing their role or permissions
    if (loggedInUser.role !== 'admin') {
        if (req.body.role) delete req.body.role;
        if (req.body.permissions) delete req.body.permissions;
    }

    const [affectedRows] = await userService.updateUser(userIdToUpdate, req.body);

    if (affectedRows === 0) {
      throw new ApiError(404, 'User not found');
    }

    const updatedUser = await userService.getUserById(userIdToUpdate);
    return success(res, updatedUser, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a user
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res, next) => {
  try {
    const affectedRows = await userService.deleteUser(req.params.id);
    if (affectedRows === 0) {
      throw new ApiError(404, 'User not found');
    }
    return success(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign permissions to a user
 * @route   POST /api/users/:id/permissions
 * @access  Private/Admin
 */
const assignPermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      throw new ApiError(400, 'Permissions must be an array of strings');
    }

    const result = await userService.setUserPermissions(id, permissions);
    if (!result) {
      throw new ApiError(404, 'User not found');
    }

    const updatedUser = await userService.getUserById(id);
    return success(res, updatedUser, 'Permissions assigned successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  assignPermissions,
};
