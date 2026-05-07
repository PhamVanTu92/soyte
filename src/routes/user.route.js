const { Router } = require('express');
const { body, query, param } = require('express-validator');
const userController = require('../controllers/user.controller');
const { verifyToken: protect } = require('../middlewares/auth.middleware'); // Alias verifyToken as protect
const { authorize } = require('../middlewares/authorize.middleware');
const { checkPermission } = require('../middlewares/checkPermission.middleware');

const router = Router();

// Validation rules
const updateUserRules = [
  param('id').isInt({ min: 1 }).withMessage('User ID must be a positive integer.'),
  body('email').optional().isEmail().withMessage('Please provide a valid email.'),
  body('full_name').optional().notEmpty().withMessage('Full name cannot be empty.'),
  body('role').optional().isIn(['admin', 'user', 'office', 'leader']).withMessage('Invalid role specified.'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status specified.'),
  body('is_verified').optional().isBoolean().withMessage('is_verified must be a boolean.'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array.'),
];

const getUsersQueryRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
  query('q').optional().isString().withMessage('Search query must be a string.'),
  query('role').optional().isIn(['admin', 'user', 'office', 'leader']).withMessage('Invalid role specified.'),
  query('unit').optional().isString().withMessage('Unit must be a string.'),
];

// All user routes are protected
router.use(protect);

// GET /api/users - Get all users (Admin only)
router.get(
  '/',
  authorize('admin'),
  checkPermission(['users', 'users.view']),
  getUsersQueryRules,
  userController.getUsers
);

router.get(
  '/:id',
  authorize(['admin']),
  checkPermission(['users', 'users.view']),
  param('id').isInt({ min: 1 }),
  userController.getUserById
);

router.put(
  '/:id',
  authorize(['admin']),
  checkPermission(['users']),
  updateUserRules,
  userController.updateUser
);

router.delete(
  '/:id',
  authorize(['admin']),
  checkPermission(['users']),
  param('id').isInt({ min: 1 }),
  userController.deleteUser
);

// POST /api/users/:id/permissions — gán permissions cá nhân (bị block nếu user có role)
router.post(
  '/:id/permissions',
  authorize(['admin']),
  checkPermission(['users']),
  param('id').isInt({ min: 1 }),
  body('permissions').isArray().withMessage('Permissions must be an array.'),
  userController.assignPermissions
);

// PUT /api/users/:id/role — gán / hủy gán role cho user
router.put(
  '/:id/role',
  authorize(['admin']),
  checkPermission(['users']),
  param('id').isInt({ min: 1 }),
  body('role_id').optional({ nullable: true }),
  userController.assignRole
);

module.exports = router;
