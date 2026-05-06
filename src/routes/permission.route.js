const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permission.controller');
const { verifyToken: protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');

// All permission routes require admin access for safety
router.use(protect);
router.use(authorize(['admin']));

router.get('/', permissionController.getAllPermissions);
router.get('/:id', permissionController.getPermissionById);
router.post('/', permissionController.createPermission);
router.put('/:id', permissionController.updatePermission);
router.delete('/:id', permissionController.deletePermission);

module.exports = router;
