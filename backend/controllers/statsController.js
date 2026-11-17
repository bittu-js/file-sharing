const File = require('../models/File');
const Folder = require('../models/Folder');
const Share = require('../models/Share');
const Activity = require('../models/Activity');
const User = require('../models/User');

/**
 * @desc    Get dashboard metrics and storage breakdown for current user
 * @route   GET /api/stats/dashboard
 * @access  Private
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userQuota = req.user.storageQuota || 500 * 1024 * 1024;

    // Total active files and folders
    const [totalFiles, totalFolders, totalFavorites] = await Promise.all([
      File.countDocuments({ owner: userId, isTrash: false }),
      Folder.countDocuments({ owner: userId, isTrash: false }),
      File.countDocuments({ owner: userId, isFavorite: true, isTrash: false })
    ]);

    // Sum of storage used via MongoDB Aggregation Pipeline
    const storageResult = await File.aggregate([
      { $match: { owner: userId, isTrash: false } },
      { $group: { _id: null, totalBytes: { $sum: '$fileSize' } } }
    ]);
    const totalStorageBytes = storageResult.length > 0 ? storageResult[0].totalBytes : 0;
    const quotaPercentage = Math.min(
      100,
      parseFloat(((totalStorageBytes / userQuota) * 100).toFixed(1))
    );

    // Active shares count
    const totalShares = await Share.countDocuments({
      createdBy: userId,
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
    });

    // Total downloads across files via aggregation
    const downloadsResult = await File.aggregate([
      { $match: { owner: userId } },
      { $group: { _id: null, totalDownloads: { $sum: '$downloadCount' } } }
    ]);
    const totalDownloads = downloadsResult.length > 0 ? downloadsResult[0].totalDownloads : 0;

    // Recent 5 files
    const recentFiles = await File.find({ owner: userId, isTrash: false })
      .populate('folder', 'name color')
      .sort({ uploadDate: -1 })
      .limit(5);

    // Storage breakdown by type via aggregation
    const allFiles = await File.find({ owner: userId, isTrash: false }).select(
      'fileType fileSize'
    );

    const breakdown = {
      documents: { count: 0, bytes: 0 },
      images: { count: 0, bytes: 0 },
      archives: { count: 0, bytes: 0 },
      media: { count: 0, bytes: 0 },
      other: { count: 0, bytes: 0 }
    };

    allFiles.forEach((f) => {
      const type = f.fileType ? f.fileType.toLowerCase() : '';
      const size = f.fileSize || 0;

      if (type.startsWith('image/')) {
        breakdown.images.count++;
        breakdown.images.bytes += size;
      } else if (
        type.includes('pdf') ||
        type.includes('word') ||
        type.includes('document') ||
        type.includes('text') ||
        type.includes('sheet') ||
        type.includes('presentation')
      ) {
        breakdown.documents.count++;
        breakdown.documents.bytes += size;
      } else if (
        type.includes('zip') ||
        type.includes('tar') ||
        type.includes('rar') ||
        type.includes('7z') ||
        type.includes('gzip')
      ) {
        breakdown.archives.count++;
        breakdown.archives.bytes += size;
      } else if (type.startsWith('audio/') || type.startsWith('video/')) {
        breakdown.media.count++;
        breakdown.media.bytes += size;
      } else {
        breakdown.other.count++;
        breakdown.other.bytes += size;
      }
    });

    // Recent 10 audit activities
    const recentActivities = await Activity.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      stats: {
        totalFiles,
        totalFolders,
        totalFavorites,
        totalStorageBytes,
        storageQuota: userQuota,
        quotaPercentage,
        totalShares,
        totalDownloads,
        recentFiles,
        recentActivities,
        breakdown
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user storage quota (Settings configuration)
 * @route   PATCH /api/stats/quota
 * @access  Private
 */
const updateStorageQuota = async (req, res, next) => {
  try {
    const { quotaBytes } = req.body;
    if (!quotaBytes || Number(quotaBytes) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid storage quota in bytes is required.'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.storageQuota = Number(quotaBytes);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Storage quota updated successfully.',
      storageQuota: user.storageQuota
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  updateStorageQuota
};
