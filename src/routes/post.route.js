const { Router } = require('express');
const { body, query } = require('express-validator');
const postController = require('../controllers/post.controller');
const { verifyToken: protect } = require('../middlewares/auth.middleware'); // Correctly alias verifyToken as protect
const { authorize } = require('../middlewares/authorize.middleware');
const { checkPermission } = require('../middlewares/checkPermission.middleware');
const uploadPostImage = require('../middlewares/postUpload.middleware');


const router = Router();

// Validation rules for creating/updating a post
const postValidationRules = [
  body('title').notEmpty().withMessage('Title is required').isString().isLength({ max: 255 }).withMessage('Title must be at most 255 characters long'),
  body('summary').optional().isString(),
  body('content').optional().isString(),
  body('image_url').optional().isURL().withMessage('Image URL must be a valid URL').isLength({ max: 5000 }).withMessage('Image URL must be at most 5000 characters long'),
  body('status').optional().isIn(['draft', 'published']).withMessage('Invalid status'),
  body('is_featured').optional().isBoolean(),
  body('category_id').optional().isInt({ gt: 0 }),
  // author_id is now automatically set from the logged-in user
  body('expires_at').optional({ checkFalsy: true }).isISO8601().toDate(),
];

// Validation for query parameters
const getPostsQueryRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['draft', 'published']),
  query('category_id').optional().isInt(),
  query('is_featured').optional().isBoolean(),
  query('q').optional().isString(),
];

// Exemple Body: 
//  [
//   {
//     "category_id": 3,
//     "limit": 5
//   },
// ]
const postsByCategoriesValidationRules = [
  body().isArray().withMessage('Request body must be an array'),
  body('*.category_id').isInt({ gt: 0 }).withMessage('category_id must be a positive integer'),
  body('*.limit').isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50'),
];

// Public routes
router.get(
  '/',
  // protect,
  // checkPermission(['posts', 'posts.view']),
  getPostsQueryRules,
  postController.getPosts
);

router.post(
  '/by-categories',
  // protect,
  // checkPermission(['posts', 'posts.view']),
  postsByCategoriesValidationRules,
  postController.getPostsByCategories
);

router.get(
  '/sub',
  protect,
  checkPermission(['posts.view']),
  postController.fetchAndStoreNews,
);

router.get(
  '/:id',
  // protect,
  // checkPermission(['posts', 'posts.view']),
  postController.getPostById
);

router.post(
  '/',
  protect,
  checkPermission(['posts.view']),
  postValidationRules,
  postController.createPost
);

router.put(
  '/:id',
  protect,
  checkPermission(['posts.view']),
  postValidationRules,
  postController.updatePost
);

router.delete(
  '/:id',
  protect,
  checkPermission(['posts.view']),
  postController.deletePost
);

module.exports = router;
