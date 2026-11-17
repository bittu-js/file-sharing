const mime = require('mime-types');
const FileRequest = require('../models/FileRequest');
const File = require('../models/File');
const User = require('../models/User');
const { generateShareToken, sanitizeFilename, calculateFileHash, getSafeFilePath } = require('../utils/fileSecurity');
const { logActivity } = require('../utils/activityLogger');

/**
 * @desc    Create a new file request upload link
 * @route   POST /api/file-requests
 * @access  Private
 */
const createFileRequest = async (req, res, next) => {
  try {
    const { title, description = '', destinationFolder = null, expiresInHours = null } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Request title is required.'
      });
    }

    const requestToken = generateShareToken(16);
    let expiresAt = null;
    if (expiresInHours && Number(expiresInHours) > 0) {
      expiresAt = new Date(Date.now() + Number(expiresInHours) * 60 * 60 * 1000);
    }

    const fileRequest = await FileRequest.create({
      title: title.trim(),
      description: description.trim(),
      destinationFolder: destinationFolder || null,
      requestToken,
      expiresAt,
      createdBy: req.user._id
    });

    await logActivity({
      user: req.user._id,
      action: 'file_request_created',
      targetType: 'file_request',
      targetId: fileRequest._id,
      targetName: fileRequest.title
    });

    res.status(201).json({
      success: true,
      fileRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's file requests
 * @route   GET /api/file-requests
 * @access  Private
 */
const getMyFileRequests = async (req, res, next) => {
  try {
    const requests = await FileRequest.find({ createdBy: req.user._id })
      .populate('destinationFolder', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      fileRequests: requests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Revoke/delete a file request
 * @route   DELETE /api/file-requests/:id
 * @access  Private
 */
const revokeFileRequest = async (req, res, next) => {
  try {
    const request = await FileRequest.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'File request not found.'
      });
    }

    await FileRequest.findByIdAndDelete(request._id);

    res.status(200).json({
      success: true,
      message: 'File request link revoked and deleted.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Public info for file request
 * @route   GET /api/file-requests/public/:token
 * @access  Public
 */
const getPublicFileRequest = async (req, res, next) => {
  try {
    const { token } = req.params;
    const request = await FileRequest.findOne({ requestToken: token })
      .populate('createdBy', 'name email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'File request not found or has been revoked.'
      });
    }

    if (!request.isActive) {
      return res.status(410).json({
        success: false,
        message: 'This upload request has been closed.'
      });
    }

    if (request.expiresAt && new Date(request.expiresAt) < new Date()) {
      return res.status(410).json({
        success: false,
        message: 'This upload request has expired.'
      });
    }

    res.status(200).json({
      success: true,
      request: {
        title: request.title,
        description: request.description,
        requesterName: request.createdBy ? request.createdBy.name : 'Unknown User',
        expiresAt: request.expiresAt,
        submissionsCount: request.submissionsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Public upload to file request
 * @route   POST /api/file-requests/public/:token/upload
 * @access  Public
 */
const uploadToPublicFileRequest = async (req, res, next) => {
  try {
    const { token } = req.params;
    const request = await FileRequest.findOne({ requestToken: token });

    if (!request || !request.isActive) {
      return res.status(404).json({
        success: false,
        message: 'This file request is no longer active.'
      });
    }

    if (request.expiresAt && new Date(request.expiresAt) < new Date()) {
      return res.status(410).json({
        success: false,
        message: 'This file request has expired.'
      });
    }

    // Validate uploader details
    const { uploaderName, uploaderEmail } = req.body;
    const trimmedName = typeof uploaderName === 'string' ? uploaderName.trim() : '';
    const trimmedEmail = typeof uploaderEmail === 'string' ? uploaderEmail.trim().toLowerCase() : '';

    if (!trimmedName || trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Uploader's full name is required (minimum 2 characters)."
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required.'
      });
    }

    if (!req.file && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'No files were uploaded.'
      });
    }

    const uploadedList = req.files || [req.file];
    const savedFiles = [];

    if (!Array.isArray(request.submissions)) {
      request.submissions = [];
    }

    for (const file of uploadedList) {
      const sanitizedName = sanitizeFilename(file.originalname);
      const detectedMime = mime.lookup(sanitizedName) || file.mimetype || 'application/octet-stream';
      const safePath = getSafeFilePath(file.filename);
      const hash = await calculateFileHash(safePath);

      const fileDoc = await File.create({
        originalName: sanitizedName,
        storedName: file.filename,
        fileType: detectedMime,
        fileSize: file.size,
        filePath: file.filename,
        owner: request.createdBy,
        folder: request.destinationFolder || null,
        hash,
        tags: ['Requested'],
        fileRequest: request._id,
        uploaderName: trimmedName,
        uploaderEmail: trimmedEmail,
        uploadDate: new Date()
      });

      savedFiles.push(fileDoc);

      request.submissions.push({
        file: fileDoc._id,
        originalName: sanitizedName,
        fileSize: file.size,
        fileType: detectedMime,
        uploaderName: trimmedName,
        uploaderEmail: trimmedEmail,
        uploadedAt: new Date()
      });
    }

    request.submissionsCount = request.submissions.length;
    await request.save();

    await logActivity({
      user: request.createdBy,
      action: 'file_request_upload',
      targetType: 'file_request',
      targetId: request._id,
      targetName: request.title,
      details: {
        filesCount: savedFiles.length,
        uploaderName: trimmedName,
        uploaderEmail: trimmedEmail,
        files: savedFiles.map((f) => f.originalName)
      }
    });

    res.status(201).json({
      success: true,
      message: `${savedFiles.length} file(s) uploaded successfully to ${request.title}.`,
      count: savedFiles.length,
      uploader: {
        name: trimmedName,
        email: trimmedEmail
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get submissions list for a specific file request
 * @route   GET /api/file-requests/:id/submissions
 * @access  Private
 */
const getFileRequestSubmissions = async (req, res, next) => {
  try {
    const request = await FileRequest.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    })
      .populate('destinationFolder', 'name')
      .populate({
        path: 'submissions.file',
        select: 'originalName storedName fileSize fileType uploadDate isTrash'
      });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'File request not found.'
      });
    }

    // Sort submissions newest first
    const submissions = (request.submissions || []).slice().reverse();

    res.status(200).json({
      success: true,
      request: {
        _id: request._id,
        title: request.title,
        description: request.description,
        destinationFolder: request.destinationFolder,
        requestToken: request.requestToken,
        submissionsCount: request.submissionsCount,
        expiresAt: request.expiresAt,
        isActive: request.isActive,
        createdAt: request.createdAt
      },
      count: submissions.length,
      submissions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFileRequest,
  getMyFileRequests,
  revokeFileRequest,
  getPublicFileRequest,
  uploadToPublicFileRequest,
  getFileRequestSubmissions
};
