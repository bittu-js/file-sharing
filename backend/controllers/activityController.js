const Activity = require('../models/Activity');

/**
 * @desc    Get user's activity log timeline
 * @route   GET /api/activities
 * @access  Private
 */
const getActivities = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const activities = await Activity.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: activities.length,
      activities
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get activity history for a specific file
 * @route   GET /api/activities/file/:fileId
 * @access  Private
 */
const getFileActivities = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const activities = await Activity.find({
      targetId: fileId,
      user: req.user._id
    })
      .sort({ createdAt: -1 })
      .limit(30);

    res.status(200).json({
      success: true,
      count: activities.length,
      activities
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivities,
  getFileActivities
};
