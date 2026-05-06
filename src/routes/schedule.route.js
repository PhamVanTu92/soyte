const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { checkPermission } = require('../middlewares/checkPermission.middleware');
const { createScheduleRules, updateScheduleRules } = require('../utils/validators');
const upload = require('../middlewares/upload.middleware');

// Special user-related route
router.get('/users/leaders', verifyToken, scheduleController.getLeaders);

// Export routes
router.get('/schedules/export/excel', verifyToken, scheduleController.exportSchedulesExcel);
router.get('/schedules/export/pdf', verifyToken, scheduleController.exportSchedulesPdf);

router.get('/schedules', scheduleController.getAllSchedules);
router.get('/schedules/:id', verifyToken, checkPermission(['work_schedule', 'work_schedule.view']), scheduleController.getScheduleById);

router.post(
    '/schedules',
    verifyToken,
    checkPermission(['work_schedule']),
    createScheduleRules(),
    scheduleController.createSchedule
);

router.put(
    '/schedules/:id',
    verifyToken,
    checkPermission(['work_schedule']),
    updateScheduleRules(),
    scheduleController.updateSchedule
);

router.delete(
    '/schedules/:id',
    verifyToken,
    checkPermission(['work_schedule']), // Only users with work_schedule permission can delete
    scheduleController.deleteSchedule
);

// Actions on schedules
router.patch(
    '/schedules/:id/approve',
    verifyToken,
    checkPermission(['work_schedule']), // Only users with work_schedule permission can approve
    scheduleController.approveSchedule
);

router.patch(
    '/schedules/:id/cancel',
    verifyToken,
    checkPermission(['work_schedule']), // Only users with work_schedule permission can cancel
    scheduleController.cancelSchedule
);

// Routes for attachments
router.post(
    '/schedules/:id/attachments',
    // The user must have permission to edit the schedule to add a file to it
    verifyToken,
    checkPermission(['work_schedule']),
    upload.single('file'),
    scheduleController.addAttachment
);

router.delete(
    '/attachments/:id',
    // The user must have permission to edit schedules to delete a file
    verifyToken,
    checkPermission(['work_schedule']),
    scheduleController.deleteAttachment
);

module.exports = router;
