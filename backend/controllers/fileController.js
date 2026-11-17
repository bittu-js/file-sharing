const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const archiver = require('archiver');
const File = require('../models/File');
const Folder = require('../models/Folder');
const Share = require('../models/Share');
const User = require('../models/User');
const { getSafeFilePath, sanitizeFilename, calculateFileHash } = require('../utils/fileSecurity');
const { logActivity } = require('../utils/activityLogger');

/**
 * @desc    Upload one or more files (with quota check, hashing, and duplicate detection)
 * @route   POST /api/files/upload
 * @access  Private
 */
const uploadFiles = async (req, res, next) => {
  try {
    if (!req.file && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'No file was provided for upload.'
      });
    }

    const { folderId = null, tags = '' } = req.body;
    const tagList = tags
      ? (Array.isArray(tags) ? tags : tags.split(','))
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    // Verify folder if specified
    if (folderId) {
      const folderDoc = await Folder.findOne({
        _id: folderId,
        owner: req.user._id,
        isTrash: false
      });
      if (!folderDoc) {
        return res.status(404).json({
          success: false,
          message: 'Target folder does not exist or has been deleted.'
        });
      }
    }

    const uploadedList = req.files || [req.file];
    const incomingBytes = uploadedList.reduce((acc, f) => acc + f.size, 0);

    // Storage Quota Enforcement
    const storageUsage = await File.aggregate([
      { $match: { owner: req.user._id, isTrash: false } },
      { $group: { _id: null, totalBytes: { $sum: '$fileSize' } } }
    ]);
    const currentBytes = storageUsage.length > 0 ? storageUsage[0].totalBytes : 0;
    const userQuota = req.user.storageQuota || 500 * 1024 * 1024; // default 500MB

    if (currentBytes + incomingBytes > userQuota) {
      // Clean up uploaded temporary files from disk
      uploadedList.forEach((f) => {
        try {
          const p = getSafeFilePath(f.filename);
          if (fs.existsSync(p)) fs.unlinkSync(p);
        } catch (_) {}
      });

      return res.status(413).json({
        success: false,
        message: `Storage quota exceeded. You have used ${(currentBytes / 1024 / 1024).toFixed(1)} MB of ${(userQuota / 1024 / 1024).toFixed(1)} MB quota.`
      });
    }

    const savedFiles = [];
    const duplicatesDetected = [];

    for (const file of uploadedList) {
      const sanitizedName = sanitizeFilename(file.originalname);
      const detectedMime = mime.lookup(sanitizedName) || file.mimetype || 'application/octet-stream';
      const safePath = getSafeFilePath(file.filename);
      const hash = await calculateFileHash(safePath);

      // Check for duplicate file for this user
      const existingDuplicate = await File.findOne({
        owner: req.user._id,
        hash,
        isTrash: false
      });

      if (existingDuplicate) {
        duplicatesDetected.push({
          uploadedName: sanitizedName,
          duplicateOf: existingDuplicate.originalName,
          duplicateId: existingDuplicate._id
        });
      }

      const fileDoc = await File.create({
        originalName: sanitizedName,
        storedName: file.filename,
        fileType: detectedMime,
        fileSize: file.size,
        filePath: file.filename,
        owner: req.user._id,
        folder: folderId || null,
        hash,
        tags: tagList,
        uploadDate: new Date(),
        lastAccessedAt: new Date(),
        downloadCount: 0
      });

      await logActivity({
        user: req.user._id,
        action: 'upload',
        targetType: 'file',
        targetId: fileDoc._id,
        targetName: fileDoc.originalName,
        details: { size: fileDoc.fileSize, folderId }
      });

      savedFiles.push(fileDoc);
    }

    res.status(201).json({
      success: true,
      count: savedFiles.length,
      files: savedFiles,
      duplicates: duplicatesDetected
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload a new version of an existing file
 * @route   POST /api/files/:id/versions
 * @access  Private
 */
const uploadNewVersion = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No replacement file was uploaded.'
      });
    }

    const file = await File.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id, 'collaborators.role': 'editor' }
      ]
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found or editor permission required.'
      });
    }

    const safePath = getSafeFilePath(req.file.filename);
    const newHash = await calculateFileHash(safePath);
    const sanitizedName = sanitizeFilename(req.file.originalname);
    const detectedMime = mime.lookup(sanitizedName) || req.file.mimetype || 'application/octet-stream';

    // Push current version into history array
    file.versions.push({
      versionNumber: file.version,
      storedName: file.storedName,
      fileSize: file.fileSize,
      fileType: file.fileType,
      filePath: file.filePath,
      hash: file.hash,
      uploadedAt: file.updatedAt || file.uploadDate,
      uploadedBy: file.owner
    });

    // Update to new current version
    file.version += 1;
    file.storedName = req.file.filename;
    file.filePath = req.file.filename;
    file.fileSize = req.file.size;
    file.fileType = detectedMime;
    file.hash = newHash;
    file.lastAccessedAt = new Date();

    await file.save();

    await logActivity({
      user: req.user._id,
      action: 'new_version',
      targetType: 'file',
      targetId: file._id,
      targetName: file.originalName,
      details: { newVersion: file.version, size: file.fileSize }
    });

    res.status(200).json({
      success: true,
      message: `Version ${file.version} uploaded successfully.`,
      file
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get historical versions of a file
 * @route   GET /api/files/:id/versions
 * @access  Private
 */
const getFileVersions = async (req, res, next) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id }
      ]
    }).populate('versions.uploadedBy', 'name email');

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found.'
      });
    }

    const history = [
      {
        versionNumber: file.version,
        isCurrent: true,
        storedName: file.storedName,
        fileSize: file.fileSize,
        fileType: file.fileType,
        uploadedAt: file.updatedAt || file.uploadDate,
        hash: file.hash
      },
      ...file.versions.map((v) => ({
        versionNumber: v.versionNumber,
        isCurrent: false,
        storedName: v.storedName,
        fileSize: v.fileSize,
        fileType: v.fileType,
        uploadedAt: v.uploadedAt,
        uploadedBy: v.uploadedBy,
        hash: v.hash
      }))
    ].sort((a, b) => b.versionNumber - a.versionNumber);

    res.status(200).json({
      success: true,
      currentVersion: file.version,
      versions: history
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Restore file to a previous version
 * @route   POST /api/files/:id/versions/:vNum/restore
 * @access  Private
 */
const restoreFileVersion = async (req, res, next) => {
  try {
    const targetVNum = parseInt(req.params.vNum, 10);
    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found.'
      });
    }

    const versionDoc = file.versions.find((v) => v.versionNumber === targetVNum);
    if (!versionDoc) {
      return res.status(404).json({
        success: false,
        message: `Version ${targetVNum} not found in history.`
      });
    }

    // Save current into history before rolling back
    file.versions.push({
      versionNumber: file.version,
      storedName: file.storedName,
      fileSize: file.fileSize,
      fileType: file.fileType,
      filePath: file.filePath,
      hash: file.hash,
      uploadedAt: file.updatedAt || new Date(),
      uploadedBy: req.user._id
    });

    file.version += 1;
    file.storedName = versionDoc.storedName;
    file.filePath = versionDoc.filePath;
    file.fileSize = versionDoc.fileSize;
    file.fileType = versionDoc.fileType;
    file.hash = versionDoc.hash;
    file.lastAccessedAt = new Date();

    await file.save();

    await logActivity({
      user: req.user._id,
      action: 'version_restore',
      targetType: 'file',
      targetId: file._id,
      targetName: file.originalName,
      details: { restoredFromVersion: targetVNum, newVersion: file.version }
    });

    res.status(200).json({
      success: true,
      message: `File restored from version ${targetVNum} to new version ${file.version}.`,
      file
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download historical version
 * @route   GET /api/files/:id/versions/:vNum/download
 * @access  Private
 */
const downloadFileVersion = async (req, res, next) => {
  try {
    const targetVNum = parseInt(req.params.vNum, 10);
    const file = await File.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id }
      ]
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found.'
      });
    }

    let storedName = file.storedName;
    let fileType = file.fileType;

    if (file.version !== targetVNum) {
      const vDoc = file.versions.find((v) => v.versionNumber === targetVNum);
      if (!vDoc) {
        return res.status(404).json({
          success: false,
          message: 'Historical version not found.'
        });
      }
      storedName = vDoc.storedName;
      fileType = vDoc.fileType;
    }

    const safePath = getSafeFilePath(storedName);
    if (!fs.existsSync(safePath)) {
      return res.status(404).json({
        success: false,
        message: 'File version binary missing from storage.'
      });
    }

    res.setHeader('Content-Type', fileType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="v${targetVNum}_${encodeURIComponent(file.originalName)}"`
    );

    fs.createReadStream(safePath).pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all files with search, filter, folder, tags, and sort
 * @route   GET /api/files
 * @access  Private
 */
const getFiles = async (req, res, next) => {
  try {
    const {
      search,
      category,
      folderId,
      tag,
      sort = 'date_desc',
      trash = 'false',
      favorite = 'false',
      all = 'false'
    } = req.query;

    const query = {
      owner: req.user._id,
      isTrash: trash === 'true'
    };

    // Folder filtering: if 'all' is true, don't filter by folder
    if (all !== 'true' && trash !== 'true' && favorite !== 'true') {
      query.folder = folderId ? folderId : null;
    }

    // Favorite filter
    if (favorite === 'true') {
      query.isFavorite = true;
    }

    // Tag filter
    if (tag && tag.trim()) {
      query.tags = tag.trim();
    }

    // Search filter
    if (search && search.trim() !== '') {
      query.originalName = { $regex: search.trim(), $options: 'i' };
    }

    // Category filter
    if (category && category !== 'all') {
      if (category === 'images') {
        query.fileType = { $regex: '^image/', $options: 'i' };
      } else if (category === 'documents') {
        query.fileType = {
          $in: [
            /pdf/,
            /word/,
            /document/,
            /sheet/,
            /excel/,
            /presentation/,
            /powerpoint/,
            /text\/plain/,
            /text\/csv/,
            /text\/markdown/
          ]
        };
      } else if (category === 'archives') {
        query.fileType = {
          $in: [/zip/, /tar/, /rar/, /7z/, /compressed/, /gzip/]
        };
      } else if (category === 'media') {
        query.fileType = { $regex: '^(audio|video)/', $options: 'i' };
      }
    }

    // Sorting
    let sortOption = { uploadDate: -1 };
    if (sort === 'date_asc') sortOption = { uploadDate: 1 };
    if (sort === 'date_desc') sortOption = { uploadDate: -1 };
    if (sort === 'name_asc') sortOption = { originalName: 1 };
    if (sort === 'name_desc') sortOption = { originalName: -1 };
    if (sort === 'size_asc') sortOption = { fileSize: 1 };
    if (sort === 'size_desc') sortOption = { fileSize: -1 };
    if (sort === 'recent') sortOption = { lastAccessedAt: -1 };

    const files = await File.find(query)
      .populate('folder', 'name color')
      .sort(sortOption);

    // Active shares lookup
    const fileIds = files.map((f) => f._id);
    const activeShares = await Share.find({
      file: { $in: fileIds },
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
    }).select('file shareToken expiresAt passwordHash downloadCount');

    const shareMap = {};
    activeShares.forEach((s) => {
      shareMap[s.file.toString()] = {
        shareToken: s.shareToken,
        isPasswordProtected: !!s.passwordHash,
        expiresAt: s.expiresAt,
        downloadCount: s.downloadCount
      };
    });

    const enrichedFiles = files.map((file) => {
      const fileObj = file.toObject();
      fileObj.activeShare = shareMap[file._id.toString()] || null;
      return fileObj;
    });

    res.status(200).json({
      success: true,
      count: enrichedFiles.length,
      files: enrichedFiles
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single file with full metadata and collaborators
 * @route   GET /api/files/:id
 * @access  Private
 */
const getFileById = async (req, res, next) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id }
      ]
    })
      .populate('owner', 'name email')
      .populate('folder', 'name color')
      .populate('collaborators.user', 'name email');

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found or access denied.'
      });
    }

    // Update last accessed timestamp
    file.lastAccessedAt = new Date();
    await file.save();

    const activeShare = await Share.findOne({
      file: file._id,
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
    });

    const fileObj = file.toObject();
    fileObj.activeShare = activeShare
      ? {
          shareToken: activeShare.shareToken,
          isPasswordProtected: !!activeShare.passwordHash,
          expiresAt: activeShare.expiresAt,
          downloadCount: activeShare.downloadCount
        }
      : null;

    res.status(200).json({
      success: true,
      file: fileObj
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download file
 * @route   GET /api/files/:id/download
 * @access  Private
 */
const downloadFile = async (req, res, next) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id }
      ]
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found or access denied.'
      });
    }

    const safePath = getSafeFilePath(file.storedName);
    if (!fs.existsSync(safePath)) {
      return res.status(404).json({
        success: false,
        message: 'Physical file not found on server storage.'
      });
    }

    file.downloadCount += 1;
    file.lastAccessedAt = new Date();
    await file.save();

    await logActivity({
      user: req.user._id,
      action: 'download',
      targetType: 'file',
      targetId: file._id,
      targetName: file.originalName
    });

    res.setHeader('Content-Type', file.fileType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(file.originalName)}"`
    );

    fs.createReadStream(safePath).pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Stream file for preview inline
 * @route   GET /api/files/:id/preview
 * @access  Private
 */
const previewFile = async (req, res, next) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id }
      ]
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found or access denied.'
      });
    }

    const safePath = getSafeFilePath(file.storedName);
    if (!fs.existsSync(safePath)) {
      return res.status(404).json({
        success: false,
        message: 'Physical file not found on server storage.'
      });
    }

    file.lastAccessedAt = new Date();
    await file.save();

    res.setHeader('Content-Type', file.fileType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(file.originalName)}"`
    );

    fs.createReadStream(safePath).pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Move file to another folder
 * @route   PATCH /api/files/:id/move
 * @access  Private
 */
const moveFile = async (req, res, next) => {
  try {
    const { folderId = null } = req.body;
    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found.'
      });
    }

    if (folderId) {
      const folderDoc = await Folder.findOne({
        _id: folderId,
        owner: req.user._id,
        isTrash: false
      });
      if (!folderDoc) {
        return res.status(404).json({
          success: false,
          message: 'Target folder not found.'
        });
      }
    }

    file.folder = folderId || null;
    await file.save();

    await logActivity({
      user: req.user._id,
      action: 'move',
      targetType: 'file',
      targetId: file._id,
      targetName: file.originalName,
      details: { folderId }
    });

    res.status(200).json({
      success: true,
      message: 'File moved successfully.',
      file
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update custom tags on file
 * @route   PATCH /api/files/:id/tags
 * @access  Private
 */
const updateFileTags = async (req, res, next) => {
  try {
    const { tags } = req.body;
    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found.'
      });
    }

    file.tags = Array.isArray(tags) ? tags.map((t) => t.trim()).filter(Boolean) : [];
    await file.save();

    await logActivity({
      user: req.user._id,
      action: 'tag',
      targetType: 'file',
      targetId: file._id,
      targetName: file.originalName,
      details: { tags: file.tags }
    });

    res.status(200).json({
      success: true,
      tags: file.tags
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle file favorite
 * @route   PATCH /api/files/:id/favorite
 * @access  Private
 */
const toggleFileFavorite = async (req, res, next) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found.'
      });
    }

    file.isFavorite = !file.isFavorite;
    await file.save();

    await logActivity({
      user: req.user._id,
      action: 'favorite',
      targetType: 'file',
      targetId: file._id,
      targetName: file.originalName,
      details: { isFavorite: file.isFavorite }
    });

    res.status(200).json({
      success: true,
      isFavorite: file.isFavorite
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all favorites (files and folders)
 * @route   GET /api/files/favorites
 * @access  Private
 */
const getFavorites = async (req, res, next) => {
  try {
    const [files, folders] = await Promise.all([
      File.find({ owner: req.user._id, isFavorite: true, isTrash: false }).populate(
        'folder',
        'name'
      ),
      Folder.find({ owner: req.user._id, isFavorite: true, isTrash: false })
    ]);

    res.status(200).json({
      success: true,
      files,
      folders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get recent files
 * @route   GET /api/files/recent
 * @access  Private
 */
const getRecentFiles = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 15;
    const files = await File.find({ owner: req.user._id, isTrash: false })
      .sort({ lastAccessedAt: -1, uploadDate: -1 })
      .limit(limit)
      .populate('folder', 'name');

    res.status(200).json({
      success: true,
      count: files.length,
      files
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add collaborator to file (Viewer or Editor)
 * @route   POST /api/files/:id/collaborators
 * @access  Private
 */
const addCollaborator = async (req, res, next) => {
  try {
    const { email, role = 'viewer' } = req.body;
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found or permission denied.'
      });
    }

    const targetUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'No registered user found with that email address.'
      });
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You are already the owner of this file.'
      });
    }

    // Check if collaborator already exists
    const existingIndex = file.collaborators.findIndex(
      (c) => c.user.toString() === targetUser._id.toString()
    );

    if (existingIndex >= 0) {
      file.collaborators[existingIndex].role = role;
    } else {
      file.collaborators.push({
        user: targetUser._id,
        role,
        invitedAt: new Date()
      });
    }

    await file.save();

    await logActivity({
      user: req.user._id,
      action: 'collaborator_add',
      targetType: 'file',
      targetId: file._id,
      targetName: file.originalName,
      details: { email: targetUser.email, role }
    });

    res.status(200).json({
      success: true,
      message: `Collaborator ${targetUser.email} granted ${role} access.`,
      collaborators: file.collaborators
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove collaborator from file
 * @route   DELETE /api/files/:id/collaborators/:userId
 * @access  Private
 */
const removeCollaborator = async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found.'
      });
    }

    file.collaborators = file.collaborators.filter(
      (c) => c.user.toString() !== req.params.userId
    );
    await file.save();

    await logActivity({
      user: req.user._id,
      action: 'collaborator_remove',
      targetType: 'file',
      targetId: file._id,
      targetName: file.originalName,
      details: { removedUserId: req.params.userId }
    });

    res.status(200).json({
      success: true,
      message: 'Collaborator access revoked.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get files shared with current user
 * @route   GET /api/files/shared-with-me
 * @access  Private
 */
const getSharedWithMe = async (req, res, next) => {
  try {
    const files = await File.find({
      'collaborators.user': req.user._id,
      isTrash: false
    })
      .populate('owner', 'name email')
      .populate('folder', 'name');

    res.status(200).json({
      success: true,
      count: files.length,
      files
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get files shared by current user (with links or collaborators)
 * @route   GET /api/files/shared-by-me
 * @access  Private
 */
const getSharedByMe = async (req, res, next) => {
  try {
    // Files with active public shares
    const activeShares = await Share.find({
      createdBy: req.user._id,
      isActive: true
    }).populate({
      path: 'file',
      match: { isTrash: false },
      populate: { path: 'folder', select: 'name' }
    });

    // Files with collaborators
    const collabFiles = await File.find({
      owner: req.user._id,
      'collaborators.0': { $exists: true },
      isTrash: false
    })
      .populate('collaborators.user', 'name email')
      .populate('folder', 'name');

    const filesMap = {};

    activeShares.forEach((s) => {
      if (s.file) {
        filesMap[s.file._id.toString()] = {
          file: s.file,
          share: {
            shareToken: s.shareToken,
            isPasswordProtected: !!s.passwordHash,
            expiresAt: s.expiresAt,
            downloadCount: s.downloadCount
          },
          collaborators: []
        };
      }
    });

    collabFiles.forEach((f) => {
      if (filesMap[f._id.toString()]) {
        filesMap[f._id.toString()].collaborators = f.collaborators;
      } else {
        filesMap[f._id.toString()] = {
          file: f,
          share: null,
          collaborators: f.collaborators
        };
      }
    });

    res.status(200).json({
      success: true,
      count: Object.keys(filesMap).length,
      items: Object.values(filesMap)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk Download: create a ZIP on the fly
 * @route   POST /api/files/bulk/download
 * @access  Private
 */
const bulkDownload = async (req, res, next) => {
  try {
    const { fileIds = [] } = req.body;
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No file IDs provided for bulk download.'
      });
    }

    const files = await File.find({
      _id: { $in: fileIds },
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id }
      ]
    });

    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No accessible files found.'
      });
    }

    const archive = archiver('zip', { zlib: { level: 6 } });
    const zipName = `VaultDrop_Bulk_${Date.now()}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

    archive.pipe(res);

    files.forEach((f) => {
      const safePath = getSafeFilePath(f.storedName);
      if (fs.existsSync(safePath)) {
        archive.file(safePath, { name: f.originalName });
        f.downloadCount += 1;
        f.save();
      }
    });

    await archive.finalize();
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk Move files and folders
 * @route   POST /api/files/bulk/move
 * @access  Private
 */
const bulkMove = async (req, res, next) => {
  try {
    const { fileIds = [], folderIds = [], targetFolderId = null } = req.body;

    if (fileIds.length > 0) {
      await File.updateMany(
        { _id: { $in: fileIds }, owner: req.user._id },
        { folder: targetFolderId || null }
      );
    }

    if (folderIds.length > 0) {
      await Folder.updateMany(
        { _id: { $in: folderIds }, owner: req.user._id },
        { parent: targetFolderId || null }
      );
    }

    res.status(200).json({
      success: true,
      message: `Moved ${fileIds.length} file(s) and ${folderIds.length} folder(s).`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk Move to Trash
 * @route   POST /api/files/bulk/trash
 * @access  Private
 */
const bulkTrash = async (req, res, next) => {
  try {
    const { fileIds = [], folderIds = [] } = req.body;

    if (fileIds.length > 0) {
      await File.updateMany(
        { _id: { $in: fileIds }, owner: req.user._id },
        { isTrash: true }
      );
    }

    if (folderIds.length > 0) {
      await Folder.updateMany(
        { _id: { $in: folderIds }, owner: req.user._id },
        { isTrash: true }
      );
    }

    res.status(200).json({
      success: true,
      message: `Moved ${fileIds.length + folderIds.length} items to trash.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk Restore from Trash
 * @route   POST /api/files/bulk/restore
 * @access  Private
 */
const bulkRestore = async (req, res, next) => {
  try {
    const { fileIds = [], folderIds = [] } = req.body;

    if (fileIds.length > 0) {
      await File.updateMany(
        { _id: { $in: fileIds }, owner: req.user._id },
        { isTrash: false }
      );
    }

    if (folderIds.length > 0) {
      await Folder.updateMany(
        { _id: { $in: folderIds }, owner: req.user._id },
        { isTrash: false }
      );
    }

    res.status(200).json({
      success: true,
      message: `Restored ${fileIds.length + folderIds.length} items.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk Delete permanently
 * @route   POST /api/files/bulk/delete
 * @access  Private
 */
const bulkDelete = async (req, res, next) => {
  try {
    const { fileIds = [], folderIds = [] } = req.body;

    if (fileIds.length > 0) {
      const files = await File.find({ _id: { $in: fileIds }, owner: req.user._id });
      files.forEach((f) => {
        try {
          const p = getSafeFilePath(f.storedName);
          if (fs.existsSync(p)) fs.unlinkSync(p);
          // Also remove historical versions from disk
          if (Array.isArray(f.versions)) {
            f.versions.forEach((v) => {
              const vp = getSafeFilePath(v.storedName);
              if (fs.existsSync(vp)) fs.unlinkSync(vp);
            });
          }
        } catch (_) {}
      });

      await Share.deleteMany({ file: { $in: fileIds } });
      await File.deleteMany({ _id: { $in: fileIds }, owner: req.user._id });
    }

    if (folderIds.length > 0) {
      await Folder.deleteMany({ _id: { $in: folderIds }, owner: req.user._id });
    }

    res.status(200).json({
      success: true,
      message: `Permanently deleted ${fileIds.length + folderIds.length} item(s).`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Move file to Trash or Restore from Trash
 * @route   PATCH /api/files/:id/trash
 * @access  Private
 */
const toggleTrash = async (req, res, next) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found.'
      });
    }

    file.isTrash = !file.isTrash;
    await file.save();

    await logActivity({
      user: req.user._id,
      action: file.isTrash ? 'delete' : 'restore',
      targetType: 'file',
      targetId: file._id,
      targetName: file.originalName
    });

    res.status(200).json({
      success: true,
      message: file.isTrash ? 'File moved to Trash.' : 'File restored from Trash.',
      isTrash: file.isTrash
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Permanently delete single file
 * @route   DELETE /api/files/:id
 * @access  Private
 */
const deleteFile = async (req, res, next) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found or access denied.'
      });
    }

    // Remove primary file binary
    const safePath = getSafeFilePath(file.storedName);
    if (fs.existsSync(safePath)) {
      fs.unlinkSync(safePath);
    }

    // Remove historical versions binaries
    if (Array.isArray(file.versions)) {
      file.versions.forEach((v) => {
        try {
          const vp = getSafeFilePath(v.storedName);
          if (fs.existsSync(vp)) fs.unlinkSync(vp);
        } catch (_) {}
      });
    }

    await Share.deleteMany({ file: file._id });
    await File.findByIdAndDelete(file._id);

    await logActivity({
      user: req.user._id,
      action: 'permanent_delete',
      targetType: 'file',
      targetId: file._id,
      targetName: file.originalName
    });

    res.status(200).json({
      success: true,
      message: 'File permanently deleted.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Empty Trash (permanently delete all trashed files & folders)
 * @route   POST /api/files/trash/empty
 * @access  Private
 */
const emptyTrash = async (req, res, next) => {
  try {
    const trashedFiles = await File.find({ owner: req.user._id, isTrash: true });
    const fileIds = trashedFiles.map((f) => f._id);

    trashedFiles.forEach((f) => {
      try {
        const p = getSafeFilePath(f.storedName);
        if (fs.existsSync(p)) fs.unlinkSync(p);
        if (Array.isArray(f.versions)) {
          f.versions.forEach((v) => {
            const vp = getSafeFilePath(v.storedName);
            if (fs.existsSync(vp)) fs.unlinkSync(vp);
          });
        }
      } catch (_) {}
    });

    await Share.deleteMany({ file: { $in: fileIds } });
    await File.deleteMany({ owner: req.user._id, isTrash: true });
    await Folder.deleteMany({ owner: req.user._id, isTrash: true });

    res.status(200).json({
      success: true,
      message: 'Trash emptied successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Restore all items from trash
 * @route   POST /api/files/trash/restore-all
 * @access  Private
 */
const restoreAllTrash = async (req, res, next) => {
  try {
    await File.updateMany({ owner: req.user._id, isTrash: true }, { isTrash: false });
    await Folder.updateMany({ owner: req.user._id, isTrash: true }, { isTrash: false });

    res.status(200).json({
      success: true,
      message: 'All items restored from trash.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check duplicate by SHA-256 hash
 * @route   POST /api/files/check-duplicate
 * @access  Private
 */
const checkDuplicate = async (req, res, next) => {
  try {
    const { hash } = req.body;
    if (!hash) {
      return res.status(400).json({ success: false, message: 'Hash is required.' });
    }

    const existing = await File.findOne({
      owner: req.user._id,
      hash,
      isTrash: false
    }).select('originalName fileSize uploadDate');

    res.status(200).json({
      success: true,
      isDuplicate: !!existing,
      existingFile: existing || null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadFiles,
  uploadNewVersion,
  getFileVersions,
  restoreFileVersion,
  downloadFileVersion,
  getFiles,
  getFileById,
  downloadFile,
  previewFile,
  moveFile,
  updateFileTags,
  toggleFileFavorite,
  getFavorites,
  getRecentFiles,
  addCollaborator,
  removeCollaborator,
  getSharedWithMe,
  getSharedByMe,
  bulkDownload,
  bulkMove,
  bulkTrash,
  bulkRestore,
  bulkDelete,
  toggleTrash,
  deleteFile,
  emptyTrash,
  restoreAllTrash,
  checkDuplicate
};
