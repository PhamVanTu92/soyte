const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../models');
const authService = require('../services/auth.service');
const emailService = require('../services/email.service');
const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const generateRandomToken = () => {
  return crypto.randomBytes(20).toString('hex');
};

const generateToken = (userId, role, permissions) => {
  const payload = {
    id: userId,
    role: role,
    permissions: permissions || []
  };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

// hàm đăng ký người dùng
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      throw new ApiError(400, 'Validation error', errors.array());
    const { email, username, pass, password, status, us } = req.body;

    // Mapping for new data format
    let finalPassword = password || pass;
    let finalStatus = status;
    if (finalStatus === 'active') finalStatus = 1;
    if (finalStatus === 'inactive') finalStatus = 0;
    // If it's already a string "1" or "0", parse it or treat as is if Sequelize handles it
    if (finalStatus === undefined || finalStatus === null) finalStatus = -1;
    else finalStatus = parseInt(finalStatus);

    let finalUsername = username || us;
    if (!finalUsername && email) {
      finalUsername = email.split('@')[0];
    }

    const user = await authService.registerUser({
      ...req.body,
      password: finalPassword,
      status: isNaN(finalStatus) ? -1 : finalStatus,
      username: finalUsername
    });
    const userResponse = user.toJSON();
    delete userResponse.password;
    userResponse.unit_type = user.type || (user.facility ? user.facility.type : null);

    if (userResponse.permissions) {
      userResponse.permissions = userResponse.permissions.map(p => typeof p === 'string' ? p : p.name);
    }


    // Generate token for confirmation
    const token = generateRandomToken();
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // 24 hours expiry for initial registration

    await user.update({
      reset_password_token: token,
      reset_password_expires: expires
    });

    // Generate confirmation link: /confirm-password?token=token
    const frontendUrl = process.env.FRONTEND_URL || 'https://suckhoethudo.vn';
    const confirmLink = `${frontendUrl}/confirm-password?token=${token}`;

    // Send email asynchronously (don't block the response)
    emailService.sendPasswordConfirmation(userResponse, confirmLink).catch(err => {
      console.error('Failed to send confirmation email:', err);
    });

    res.status(201).json({
      message: 'User registered successfully and confirmation email sent.',
      user: userResponse
    });
  } catch (error) {
    if (error.message === 'Email already taken' || error.message === 'Username already taken')
      throw new ApiError(409, error.message);
    next(error);
  }
};

const { formatPermissions } = require('../utils/permissionUtils');
const { isSuperAdmin } = require('../middlewares/checkPermission.middleware');

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      throw new ApiError(400, 'Validation error', errors.array());
    // Chấp nhận cả "email" lẫn "userName" (legacy client)
    const { password } = req.body;
    const email = (req.body.email || req.body.userName || req.body.username || '').trim().toLowerCase();
    const user = await authService.loginUser(email, password);
    if (!user)
      throw new ApiError(401, 'Invalid email or password');

    // ── Xác định số liệu gốc (trước merge) ──────────────────────────
    const directPermCount   = (user.permissions    || []).length;
    const assignedRoleCount = (user.assignedRoles  || []).length;

    // ── Merge role permissions vào user.permissions ──────────────────
    if (assignedRoleCount > 0) {
      const nameSet = new Set((user.permissions || []).map(p => p.name));
      const extraPerms = [];
      for (const role of user.assignedRoles) {
        for (const perm of (role.permissions || [])) {
          if (!nameSet.has(perm.name)) {
            nameSet.add(perm.name);
            extraPerms.push(perm);
          }
        }
      }
      user.permissions = [...(user.permissions || []), ...extraPerms];
    }

    const permissionNames = (user.permissions || []).map(p => typeof p === 'string' ? p : p.name);
    const token = generateToken(user.id, user.role, permissionNames);

    const userResponse = user.toJSON();
    delete userResponse.password;

    userResponse.permission_details = (user.permissions || []).map(p => ({
      name: typeof p === 'string' ? p : p.name,
      description: typeof p === 'string' ? '' : (p.description || '')
    }));

    userResponse.permission_list = permissionNames;
    // Super admin: role=admin + không có direct permission + không có assigned Role
    const isFullAdmin = user.role === 'admin' && directPermCount === 0 && assignedRoleCount === 0;
    userResponse.permissions = formatPermissions(permissionNames, isFullAdmin);
    userResponse.unit_type = user.type || (user.facility ? user.facility.type : null);

    res.status(200).json({
      message: 'Login successful',
      user: userResponse,
      token: token,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const permissionNames = (req.user.permissions || []).map(p => p.name);
    const user = req.user.toJSON();

    user.permission_details = (req.user.permissions || []).map(p => ({
      name: p.name,
      description: p.description
    }));

    user.permission_list = permissionNames;
    const directCount      = req.user._directPermCount   ?? permissionNames.length;
    const assignedRoleCnt  = req.user._assignedRoleCount ?? 0;
    const isFullAdmin = req.user.role === 'admin' && directCount === 0 && assignedRoleCnt === 0;
    console.log('[getMe] role:', req.user.role, '| directPerms:', directCount, '| assignedRoles:', assignedRoleCnt, '| isFullAdmin:', isFullAdmin);
    user.permissions = formatPermissions(permissionNames, isFullAdmin);
    user.unit_type = user.type || (req.user.facility ? req.user.facility.type : null);

    res.status(200).json({
      message: 'User profile retrieved successfully',
      user: user
    });
  } catch (error) {
    next(error);
  }
};

const checkToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    const user = await authService.validateResetToken(token);

    if (!user) {
      throw new ApiError(400, 'Link xác nhận không hợp lệ.');
    }

    res.status(200).json({
      status: 200,
      message: 'Token hợp lệ',
      username: user.username,
      email: user.email,
      is_verified: user.is_verified
    });
  } catch (error) {
    next(error);
  }
};

const confirmPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      throw new ApiError(400, 'Validation error', errors.array());

    const { token, password } = req.body;

    if (!token) {
      throw new ApiError(400, 'Token là bắt buộc');
    }

    const user = await authService.confirmPassword(token, password);
    if (!user) {
      throw new ApiError(400, 'Token không hợp lệ hoặc đã hết hạn.');
    }

    const userResponse = user.toJSON();
    delete userResponse.password;
    if (user.permissions) {
      const permissionNames = user.permissions.map(p => typeof p === 'string' ? p : p.name);
      userResponse.permissions = formatPermissions(permissionNames);
    }
    userResponse.unit_type = user.type || (user.facility ? user.facility.type : null);


    res.status(200).json({
      status: 200,
      message: 'Xác nhận mật khẩu và kích hoạt tài khoản thành công',
      user: userResponse
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      throw new ApiError(400, 'Old password and new password are required');
    }

    const user = await db.User.findByPk(req.user.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const isMatch = await user.isPasswordMatch(oldPassword);
    if (!isMatch) {
      throw new ApiError(401, 'Incorrect old password');
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { username, email } = req.body;
    if (!username && !email) {
      throw new ApiError(400, 'Username hoặc email là bắt buộc');
    }

    const where = {};
    if (email) where.email = email;
    else if (username) where.username = username;

    const user = await db.User.findOne({ where });
    if (!user) {
      throw new ApiError(404, 'Tài khoản không tồn tại');
    }

    // Generate token
    const token = generateRandomToken();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hour expiry

    user.reset_password_token = token;
    user.reset_password_expires = expires;
    await user.save();

    // Generate confirmation link: /confirm-password?token=token
    const frontendUrl = process.env.FRONTEND_URL || 'https://suckhoethudo.vn';
    const confirmLink = `${frontendUrl}/confirm-password?token=${token}`;

    // Send email
    await emailService.sendResetPasswordEmail(user, confirmLink);

    res.status(200).json({ message: 'Email đặt lại mật khẩu đã được gửi thành công' });
  } catch (error) {
    next(error);
  }
};

const resendConfirmation = async (req, res, next) => {
  try {
    const { username, email } = req.body;
    if (!username && !email) {
      throw new ApiError(400, 'Username hoặc email là bắt buộc');
    }

    const where = {};
    if (email) where.email = email;
    else if (username) where.username = username;

    const user = await db.User.findOne({ where });
    if (!user) {
      throw new ApiError(404, 'Tài khoản không tồn tại');
    }

    if (user.is_verified) {
      throw new ApiError(409, 'Tài khoản đã được xác thực trước đó.');
    }

    // Generate new token
    const token = generateRandomToken();
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // 24 hours expiry for confirmation

    user.reset_password_token = token;
    user.reset_password_expires = expires;
    await user.save();

    // Generate confirmation link
    const frontendUrl = process.env.FRONTEND_URL || 'https://suckhoethudo.vn';
    const confirmLink = `${frontendUrl}/confirm-password?token=${token}`;

    // Send email
    await emailService.sendPasswordConfirmation(user, confirmLink);

    res.status(200).json({
      status: 200,
      message: 'Email xác nhận đã được gửi lại thành công'
    });
  } catch (error) {
    next(error);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    const { username, email } = req.body;
    if (!username && !email) {
      throw new ApiError(400, 'Username hoặc email là bắt buộc');
    }

    const where = {};
    if (email) where.email = email;
    else if (username) where.username = username;

    const user = await db.User.findOne({ where });
    if (!user) {
      throw new ApiError(404, 'Tài khoản không tồn tại');
    }

    if (user.is_verified) {
      throw new ApiError(409, 'Tài khoản đã được xác thực trước đó.');
    }

    // Generate new token
    const token = generateRandomToken();
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // 24 hours expiry

    user.reset_password_token = token;
    user.reset_password_expires = expires;
    await user.save();

    // Generate confirmation link
    const frontendUrl = process.env.FRONTEND_URL || 'https://suckhoethudo.vn';
    const confirmLink = `${frontendUrl}/confirm-password?token=${token}`;

    // Send email
    await emailService.sendPasswordConfirmation(user, confirmLink);

    res.status(200).json({
      status: 200,
      message: 'Email xác nhận đã được gửi lại thành công'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  checkToken,
  confirmPassword,
  changePassword,
  forgotPassword,
  resendConfirmation,
  resendVerification,
};
