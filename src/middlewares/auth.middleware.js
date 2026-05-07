const jwt = require('jsonwebtoken');
const db = require('../models');
const apiResponse = require('../utils/apiResponse');

/**
 * Middleware to verify JWT token from Authorization header.
 * Attaches user payload to req.user if token is valid.
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return apiResponse.unauthorized(res, 'A token is required for authentication.');
  }

  try {
    // Make sure JWT_SECRET is loaded from .env
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables.');
    }
      
    const decoded = jwt.verify(token, secret);
    
    // Fetch user details from DB to ensure they exist and get up-to-date info
    const user = await db.User.findByPk(decoded.id, {
        attributes: ['id', 'email', 'full_name', 'role', 'role_id', 'unit', 'type', 'is_verified', 'created_at', 'password_changed_at'],
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
            // N:N: tất cả roles được gán qua user_roles
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

    // Merge permissions: tất cả role permissions + individual user permissions (dedup by name)
    if (user && user.assignedRoles?.length) {
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

    if (!user) {
        return apiResponse.unauthorized(res, 'Invalid token: User not found.');
    }

    if (user.password_changed_at) {
        const changedAt = Math.floor(user.password_changed_at.getTime() / 1000);
        if (decoded.iat < changedAt) {
            return apiResponse.unauthorized(res, 'Mật khẩu đã thay đổi. Vui lòng đăng nhập lại.');
        }
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
        return apiResponse.unauthorized(res, 'Token has expired.');
    }
    return apiResponse.unauthorized(res, 'Invalid Token.');
  }
};

/**
 * Middleware to optionally verify JWT token. 
 * If token exists and is valid, attaches user to req.user.
 * If token doesn't exist, allows the request to proceed as Guest.
 * If token exists but is invalid, returns 401.
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // Proceed as guest
  }

  try {
    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret);
    
    const user = await db.User.findByPk(decoded.id, {
      attributes: ['id', 'email', 'full_name', 'role', 'role_id', 'unit', 'type', 'is_verified', 'created_at'],
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

    if (user && user.assignedRoles?.length) {
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

    if (user) {
      if (user.password_changed_at) {
        const changedAt = Math.floor(user.password_changed_at.getTime() / 1000);
        if (decoded.iat < changedAt) {
          return apiResponse.unauthorized(res, 'Mật khẩu đã thay đổi. Vui lòng đăng nhập lại.');
        }
      }
      req.user = user;
    }
    next();
  } catch (err) {
    return apiResponse.unauthorized(res, 'Invalid or expired token.');
  }
};

module.exports = { verifyToken, optionalAuth };