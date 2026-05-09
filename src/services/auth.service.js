const db = require('../models');
const ApiError = require('../utils/ApiError');
const { Op } = require('sequelize');

/**
 * Create a new user (register)
 * @param {object} userData
 * @returns {Promise<User>}
 */
const registerUser = async (userData) => {
  // Check if email or username is already taken
  const { email, username, permissions } = userData;
  const existingUser = await db.User.findOne({
    where: {
      [db.Sequelize.Op.or]: [
        { email },
        ...(username ? [{ username }] : [])
      ]
    }
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new ApiError(409, 'Email đã được sử dụng');
    }
    if (username && existingUser.username === username) {
      throw new ApiError(409, 'Tên đăng nhập đã được sử dụng');
    }
  }

  const user = await db.User.create(userData);

  if (permissions && Array.isArray(permissions) && permissions.length > 0) {
    const permissionRecords = await db.Permission.findAll({
      where: {
        name: {
          [db.Sequelize.Op.in]: permissions
        }
      }
    });
    await user.setPermissions(permissionRecords);
  }

  // Reload user with permissions
  return await db.User.findByPk(user.id, {
    include: [
      {
        model: db.Permission,
        as: 'permissions',
        attributes: ['name'],
        through: { attributes: [] }
      },
      {
        model: db.SocialFacility,
        as: 'facility',
        attributes: ['type']
      }
    ]
  });
};


/**
 * Login a user
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User|null>}
 */
const loginUser = async (email, password) => {
  const user = await db.User.findOne({
    where: db.sequelize.where(
      db.sequelize.fn('LOWER', db.sequelize.col('email')),
      email.toLowerCase()
    ),
    include: [
      {
        model: db.Permission,
        as: 'permissions',
        attributes: ['name'],
        through: { attributes: [] }
      },
      {
        model: db.SocialFacility,
        as: 'facility',
        attributes: ['type']
      },
      {
        model: db.Role,
        as: 'assignedRoles',
        attributes: ['id', 'name'],
        required: false,
        through: { attributes: [] },
        include: [{
          model: db.Permission,
          as: 'permissions',
          attributes: ['name'],
          through: { attributes: [] }
        }]
      }
    ]
  });
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(401, 'Email hoặc mật khẩu không chính xác');
  }

  if (!user.is_verified) {
    throw new ApiError(401, 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email để xác thực tài khoản.');
  }

  return user;
};

/**
 * Validate a reset token and return the user if valid.
 * @param {string} token 
 * @returns {Promise<User|null>}
 */
const validateResetToken = async (token) => {
  // Tìm theo token trước (không quan tâm hết hạn chưa)
  const user = await db.User.findOne({
    where: { reset_password_token: token },
  });

  if (!user) {
    // Token không tồn tại → đã dùng rồi (bị null sau confirmPassword) hoặc sai
    throw new ApiError(400, 'Link xác nhận đã được sử dụng hoặc không hợp lệ.');
  }

  if (user.reset_password_expires && user.reset_password_expires < new Date()) {
    throw new ApiError(400, 'Link xác nhận đã hết hạn (24h). Vui lòng yêu cầu gửi lại email.');
  }

  return user;
};

/**
 * Confirm password and verify user using token
 * @param {string} token
 * @param {string} password
 * @returns {Promise<User|null>}
 */
const confirmPassword = async (token, password) => {
  const user = await validateResetToken(token);

  user.password = password;
  user.is_verified = true;
  user.status = 1;
  user.reset_password_token = null; // Clear token after use
  user.reset_password_expires = null;
  await user.save();
  // Reload user with permissions
  return await db.User.findByPk(user.id, {
    include: [
      {
        model: db.Permission,
        as: 'permissions',
        attributes: ['name'],
        through: { attributes: [] }
      },
      {
        model: db.SocialFacility,
        as: 'facility',
        attributes: ['type']
      }
    ]
  });
};

module.exports = {
  registerUser,
  loginUser,
  validateResetToken,
  confirmPassword,
};

