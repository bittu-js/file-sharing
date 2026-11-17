const fs = require('fs');
const bcrypt = require('bcryptjs');
const File = require('../models/File');
const Share = require('../models/Share');
const { generateShareToken, getSafeFilePath } = require('../utils/fileSecurity');

/**
 * @desc    Generate a shareable link for a file
 * @route   POST /api/shares
 * @access  Private
 */
const createShare = async (req, res, next) => {
  try {
    const { fileId, password, expiresInHours, expiresAt } = req.body;

    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: 'File ID is required to create a share link.'
      });
    }

    const file = await File.findOne({ _id: fileId, owner: req.user._id });
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found or you do not have permission to share it.'
      });
    }

    // Check if an active share already exists for this file
    const existingShare = await Share.findOne({
      file: file._id,
      createdBy: req.user._id,
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
    });

    // Hash password if provided
    let passwordHash = null;
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password.trim(), salt);
    }

    // Calculate expiration date
    let expirationDate = null;
    if (expiresAt) {
      expirationDate = new Date(expiresAt);
    } else if (expiresInHours && Number(expiresInHours) > 0) {
      expirationDate = new Date(Date.now() + Number(expiresInHours) * 60 * 60 * 1000);
    }

    // If active share exists, update it or generate a new one
    let share;
    if (existingShare) {
      existingShare.passwordHash = passwordHash;
      existingShare.expiresAt = expirationDate;
      existingShare.isActive = true;
      share = await existingShare.save();
    } else {
      const shareToken = generateShareToken(16);
      share = await Share.create({
        file: file._id,
        shareToken,
        passwordHash,
        expiresAt: expirationDate,
        isActive: true,
        createdBy: req.user._id
      });
    }

    res.status(201).json({
      success: true,
      share: {
        id: share._id,
        shareToken: share.shareToken,
        file: {
          id: file._id,
          originalName: file.originalName,
          fileSize: file.fileSize,
          fileType: file.fileType
        },
        isPasswordProtected: !!share.passwordHash,
        expiresAt: share.expiresAt,
        isActive: share.isActive,
        downloadCount: share.downloadCount,
        createdAt: share.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all shares created by logged-in user
 * @route   GET /api/shares
 * @access  Private
 */
const getMyShares = async (req, res, next) => {
  try {
    const shares = await Share.find({ createdBy: req.user._id })
      .populate('file', 'originalName fileSize fileType uploadDate')
      .sort({ createdAt: -1 });

    const formattedShares = shares.map((s) => ({
      id: s._id,
      shareToken: s.shareToken,
      file: s.file,
      isPasswordProtected: !!s.passwordHash,
      expiresAt: s.expiresAt,
      isExpired: s.expiresAt ? new Date(s.expiresAt) < new Date() : false,
      isActive: s.isActive,
      downloadCount: s.downloadCount,
      createdAt: s.createdAt
    }));

    res.status(200).json({
      success: true,
      count: formattedShares.length,
      shares: formattedShares
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Public metadata for a shared link
 * @route   GET /api/shares/:token
 * @access  Public
 */
const getShareByToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    const share = await Share.findOne({ shareToken: token }).populate(
      'file',
      'originalName fileSize fileType uploadDate storedName'
    ).populate('createdBy', 'name');

    if (!share || !share.file) {
      return res.status(404).json({
        success: false,
        message: 'Shared link not found or has been removed.'
      });
    }

    if (!share.isActive) {
      return res.status(410).json({
        success: false,
        message: 'This sharing link has been revoked or deactivated by the owner.'
      });
    }

    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return res.status(410).json({
        success: false,
        message: 'This sharing link has expired.'
      });
    }

    res.status(200).json({
      success: true,
      share: {
        shareToken: share.shareToken,
        fileName: share.file.originalName,
        fileSize: share.file.fileSize,
        fileType: share.file.fileType,
        sharedBy: share.createdBy ? share.createdBy.name : 'Unknown User',
        uploadDate: share.file.uploadDate,
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
        isPasswordProtected: !!share.passwordHash,
        downloadCount: share.downloadCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download file via public share link
 * @route   POST /api/shares/:token/download
 * @access  Public
 */
const downloadSharedFile = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const share = await Share.findOne({ shareToken: token }).populate('file');

    if (!share || !share.file) {
      return res.status(404).json({
        success: false,
        message: 'Shared link not found.'
      });
    }

    if (!share.isActive) {
      return res.status(410).json({
        success: false,
        message: 'This sharing link is inactive.'
      });
    }

    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return res.status(410).json({
        success: false,
        message: 'This sharing link has expired.'
      });
    }

    // Password verification
    if (share.passwordHash) {
      if (!password) {
        return res.status(401).json({
          success: false,
          requiresPassword: true,
          message: 'This file is password-protected. Please enter the password.'
        });
      }

      const isMatch = await share.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          requiresPassword: true,
          message: 'Incorrect password for this shared file.'
        });
      }
    }

    const file = share.file;
    const safePath = getSafeFilePath(file.storedName);

    if (!fs.existsSync(safePath)) {
      return res.status(404).json({
        success: false,
        message: 'Physical file not found on server storage.'
      });
    }

    // Increment share and file download counts
    share.downloadCount += 1;
    await share.save();

    file.downloadCount += 1;
    await file.save();

    res.setHeader('Content-Type', file.fileType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(file.originalName)}"`
    );

    const stream = fs.createReadStream(safePath);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Stream shared file for preview (Public preview)
 * @route   POST /api/shares/:token/preview
 * @access  Public
 */
const previewSharedFile = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const share = await Share.findOne({ shareToken: token }).populate('file');

    if (!share || !share.file) {
      return res.status(404).json({
        success: false,
        message: 'Shared link not found.'
      });
    }

    if (!share.isActive) {
      return res.status(410).json({
        success: false,
        message: 'This sharing link is inactive.'
      });
    }

    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return res.status(410).json({
        success: false,
        message: 'This sharing link has expired.'
      });
    }

    if (share.passwordHash) {
      if (!password) {
        return res.status(401).json({
          success: false,
          requiresPassword: true,
          message: 'Password required to preview this file.'
        });
      }

      const isMatch = await share.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          requiresPassword: true,
          message: 'Incorrect password.'
        });
      }
    }

    const file = share.file;
    const safePath = getSafeFilePath(file.storedName);

    if (!fs.existsSync(safePath)) {
      return res.status(404).json({
        success: false,
        message: 'Physical file not found.'
      });
    }

    res.setHeader('Content-Type', file.fileType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(file.originalName)}"`
    );

    const stream = fs.createReadStream(safePath);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Revoke or delete a share link
 * @route   DELETE /api/shares/:id
 * @access  Private
 */
const revokeShare = async (req, res, next) => {
  try {
    const share = await Share.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Share link not found or access denied.'
      });
    }

    await Share.findByIdAndDelete(share._id);

    res.status(200).json({
      success: true,
      message: 'Share link revoked and permanently disabled.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createShare,
  getMyShares,
  getShareByToken,
  downloadSharedFile,
  previewSharedFile,
  revokeShare
};
