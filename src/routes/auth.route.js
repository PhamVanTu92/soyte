const { Router } = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { verifyToken: protect } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/checkPermission.middleware');

const router = Router();

// Validation rules for registration
const registerRules = [
  body('email').isEmail().withMessage('Vui lòng cung cấp địa chỉ email hợp lệ'),
  body().custom((value, { req }) => {
    if (!req.body.password && !req.body.pass) {
      throw new Error('Vui lòng cung cấp mật khẩu');
    }
    return true;
  }),
  body('full_name').notEmpty().withMessage('Họ và tên là bắt buộc'),
  body('unit').custom((value, { req }) => {
    if (req.body.role === 'admin') {
      return true;
    }
    if (!value || value.trim() === '') {
      throw new Error('Đơn vị là bắt buộc');
    }
    return true;
  }),
];

// Validation rules for login
const loginRules = [
  body().custom((value, { req }) => {
    const id = req.body.email || req.body.userName || req.body.username;
    if (!id || !id.trim()) throw new Error('Vui lòng cung cấp email hoặc tên đăng nhập');
    return true;
  }),
  body('password').notEmpty().withMessage('Mật khẩu là bắt buộc'),
];

// Define routes
router.post(
  '/register',
  registerRules,
  authController.register
);

router.post(
  '/login',
  loginRules,
  authController.login,
);

router.get('/me', protect, authController.getMe);

router.get('/check-token/:token', authController.checkToken);

router.post(
  '/confirm-password',
  [
    body('token').notEmpty().withMessage('Token là bắt buộc'),
    body('password').isLength({ min: 8 }).withMessage('Mật khẩu phải có ít nhất 8 ký tự'),
  ],
  authController.confirmPassword
);

router.put(
  '/change-password',
  protect,
  [
    body('oldPassword').notEmpty().withMessage('Mật khẩu cũ là bắt buộc'),
    body('newPassword').isLength({ min: 8 }).withMessage('Mật khẩu mới phải có ít nhất 8 ký tự'),
  ],
  authController.changePassword
);

router.post(
  '/forgot-password',
  [
    body().custom((value, { req }) => {
      if (!req.body.username && !req.body.email)
        throw new Error('Vui lòng cung cấp tên đăng nhập hoặc email');
      return true;
    }),
    body('email').optional().isEmail().withMessage('Vui lòng cung cấp địa chỉ email hợp lệ'),
  ],
  authController.forgotPassword
);

router.post(
  '/resend-confirmation',
  protect,
  checkPermission('users'),
  [
    body().custom((value, { req }) => {
      if (!req.body.username && !req.body.email) {
        throw new Error('Vui lòng cung cấp tên đăng nhập hoặc email');
      }
      return true;
    }),
    body('email').optional().isEmail().withMessage('Vui lòng cung cấp địa chỉ email hợp lệ'),
  ],
  authController.resendConfirmation
);

router.post(
  '/resend-verification',
  [
    body().custom((value, { req }) => {
      if (!req.body.username && !req.body.email) {
        throw new Error('Vui lòng cung cấp tên đăng nhập hoặc email');
      }
      return true;
    }),
    body('email').optional().isEmail().withMessage('Vui lòng cung cấp địa chỉ email hợp lệ'),
  ],
  authController.resendVerification
);

module.exports = router;

