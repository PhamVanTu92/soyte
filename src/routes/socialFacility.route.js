const express = require('express');
const router = express.Router();
const socialFacilityController = require('../controllers/socialFacility.controller');
const { verifyToken: protect } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/checkPermission.middleware');


router.get('/', socialFacilityController.getAll);
router.get('/:id', socialFacilityController.getById);

router.use(protect);
router.post('/', checkPermission(['social_facilities.view']), socialFacilityController.create);
router.put('/:id', checkPermission(['social_facilities.view']), socialFacilityController.update);
router.delete('/:id', checkPermission(['social_facilities.view']), socialFacilityController.remove);

module.exports = router;
