const { body, validationResult } = require('express-validator');
const apiResponse = require('./apiResponse');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));

    return apiResponse.badRequest(res, 'Validation failed', extractedErrors);
};

const createScheduleRules = () => {
    return [
        body('title').notEmpty().withMessage('Title is required.'),
        body('start_time').isISO8601().withMessage('Invalid start_time format.'),
        body('end_time').isISO8601().withMessage('Invalid end_time format.'),
        // body('presider_id').isInt().withMessage('presider_id must be an integer.'),
        // body('attendee_ids').optional().isArray().withMessage('attendee_ids must be an array.'),
        // body('attendee_ids.*').isInt().withMessage('Each attendee_id must be an integer.'),
        validate
    ];
};

const updateScheduleRules = () => {
    return [
        body('title').optional().notEmpty().withMessage('Title cannot be empty.'),
        body('start_time').optional().isISO8601().withMessage('Invalid start_time format.'),
        body('end_time').optional().isISO8601().withMessage('Invalid end_time format.'),
        body('presider_id').optional().isInt().withMessage('presider_id must be an integer.'),
        body('attendee_ids').optional().isArray().withMessage('attendee_ids must be an array.'),
        body('attendee_ids.*').optional().isInt().withMessage('Each attendee_id must be an integer.'),
        validate
    ];
};


module.exports = {
    createScheduleRules,
    updateScheduleRules,
};
