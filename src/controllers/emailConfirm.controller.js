const db = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Get email confirmation settings
 * @route   GET /api/email-confirm
 * @access  Private/Admin
 */
const getEmailSettings = async (req, res, next) => {
  try {
    const settings = await db.EmailConfirm.findOne({ order: [['created_at', 'DESC']] });
    if (!settings) {
      throw new ApiError(404, 'Settings not found');
    }
    res.status(200).json({
      message: 'Email settings retrieved successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update email confirmation settings
 * @route   PUT /api/email-confirm
 * @access  Private/Admin
 */
const updateEmailSettings = async (req, res, next) => {
  try {
    let settings = await db.EmailConfirm.findOne({ order: [['created_at', 'DESC']] });
    
    if (!settings) {
      settings = await db.EmailConfirm.create(req.body);
    } else {
      await settings.update(req.body);
    }

    res.status(200).json({
      message: 'Email settings updated successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmailSettings,
  updateEmailSettings
};
