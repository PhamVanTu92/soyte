const express = require('express');
const router = express.Router();
const affiliatedFacilityController = require('../controllers/affiliatedFacility.controller');

const { verifyToken: protect } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/checkPermission.middleware');

router.get('/', affiliatedFacilityController.getAll);
router.get('/:id', affiliatedFacilityController.getById);

router.post('/', protect, checkPermission(['affiliated_facility']), affiliatedFacilityController.create);
router.put('/:id', protect, checkPermission(['affiliated_facility']), affiliatedFacilityController.update);
router.delete('/:id', protect, checkPermission(['affiliated_facility']), affiliatedFacilityController.delete);

module.exports = router;
