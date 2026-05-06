const apiResponse = require('../utils/apiResponse');

/**
 * Middleware factory to check if the authenticated user has one of the required roles.
 * @param {string|string[]} roles - A single role or an array of roles to authorize.
 */
const authorize = (roles = []) => {
  // Coerce single role to array
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    // Ensure req.user is attached by verifyToken middleware
    if (!req.user) {
        return apiResponse.unauthorized(res);
    }

    // If roles are specified, check if the user's role is included
    if (roles.length && !roles.includes(req.user.role)) {
      return apiResponse.forbidden(res, 'You do not have permission to perform this action.');
    }

    // User is authorized
    next();
  };
};

module.exports = { authorize };
