const Activity = require('../models/Activity');

/**
 * Record an audit log event in the database
 */
const logActivity = async ({
  user,
  action,
  targetType,
  targetId,
  targetName,
  details = {}
}) => {
  try {
    if (!user || !action || !targetType || !targetName) return null;
    return await Activity.create({
      user,
      action,
      targetType,
      targetId,
      targetName,
      details
    });
  } catch (err) {
    console.error('Failed to log activity:', err.message);
    return null;
  }
};

module.exports = { logActivity };
