const Folder = require('../models/Folder');
const File = require('../models/File');
const { logActivity } = require('../utils/activityLogger');
const { runInTransaction } = require('../utils/dbTransactions');

/**
 * @desc    Create a new folder
 * @route   POST /api/folders
 * @access  Private
 */
const createFolder = async (req, res, next) => {
  try {
    const { name, parentId = null, color = 'blue' } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required.'
      });
    }

    // If parentId provided, verify existence and ownership
    if (parentId) {
      const parentFolder = await Folder.findOne({
        _id: parentId,
        owner: req.user._id,
        isTrash: false
      });
      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Parent folder not found.'
        });
      }
    }

    const folder = await Folder.create({
      name: name.trim(),
      parent: parentId || null,
      owner: req.user._id,
      color
    });

    await logActivity({
      user: req.user._id,
      action: 'upload',
      targetType: 'folder',
      targetId: folder._id,
      targetName: folder.name
    });

    res.status(201).json({
      success: true,
      folder
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get folders for user (filtered by parent)
 * @route   GET /api/folders
 * @access  Private
 */
const getFolders = async (req, res, next) => {
  try {
    const { parentId, trash = 'false', all = 'false' } = req.query;

    const query = {
      owner: req.user._id,
      isTrash: trash === 'true'
    };

    if (all !== 'true') {
      query.parent = parentId ? parentId : null;
    }

    const folders = await Folder.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: folders.length,
      folders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get folder breadcrumb path
 * @route   GET /api/folders/:id/breadcrumbs
 * @access  Private
 */
const getFolderBreadcrumbs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const breadcrumbs = [];

    let currentId = id;
    while (currentId) {
      const folder = await Folder.findOne({
        _id: currentId,
        owner: req.user._id
      }).select('name parent');

      if (!folder) break;

      breadcrumbs.unshift({ id: folder._id, name: folder.name });
      currentId = folder.parent;
    }

    res.status(200).json({
      success: true,
      breadcrumbs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update folder (rename, color)
 * @route   PATCH /api/folders/:id
 * @access  Private
 */
const updateFolder = async (req, res, next) => {
  try {
    const { name, color } = req.body;
    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found.'
      });
    }

    if (name) folder.name = name.trim();
    if (color) folder.color = color;

    await folder.save();

    await logActivity({
      user: req.user._id,
      action: 'rename',
      targetType: 'folder',
      targetId: folder._id,
      targetName: folder.name
    });

    res.status(200).json({
      success: true,
      folder
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Move folder to another parent folder
 * @route   PATCH /api/folders/:id/move
 * @access  Private
 */
const moveFolder = async (req, res, next) => {
  try {
    const { targetParentId = null } = req.body;
    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found.'
      });
    }

    // Prevent moving folder into itself
    if (targetParentId && targetParentId.toString() === folder._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot move a folder into itself.'
      });
    }

    folder.parent = targetParentId || null;
    await folder.save();

    await logActivity({
      user: req.user._id,
      action: 'move',
      targetType: 'folder',
      targetId: folder._id,
      targetName: folder.name,
      details: { targetParentId }
    });

    res.status(200).json({
      success: true,
      folder
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle folder favorite
 * @route   PATCH /api/folders/:id/favorite
 * @access  Private
 */
const toggleFolderFavorite = async (req, res, next) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found.'
      });
    }

    folder.isFavorite = !folder.isFavorite;
    await folder.save();

    res.status(200).json({
      success: true,
      isFavorite: folder.isFavorite
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Move folder to trash
 * @route   PATCH /api/folders/:id/trash
 * @access  Private
 */
const trashFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found.'
      });
    }

    folder.isTrash = !folder.isTrash;
    await folder.save();

    // Cascading soft trash on files directly in this folder
    await File.updateMany(
      { folder: folder._id, owner: req.user._id },
      { isTrash: folder.isTrash }
    );

    await logActivity({
      user: req.user._id,
      action: folder.isTrash ? 'delete' : 'restore',
      targetType: 'folder',
      targetId: folder._id,
      targetName: folder.name
    });

    res.status(200).json({
      success: true,
      message: folder.isTrash ? 'Folder moved to trash.' : 'Folder restored.',
      isTrash: folder.isTrash
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete folder permanently
 * @route   DELETE /api/folders/:id
 * @access  Private
 */
const deleteFolderPermanent = async (req, res, next) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found.'
      });
    }

    // Move files in this folder to root or delete
    await File.updateMany(
      { folder: folder._id, owner: req.user._id },
      { folder: null }
    );

    await Folder.findByIdAndDelete(folder._id);

    await logActivity({
      user: req.user._id,
      action: 'permanent_delete',
      targetType: 'folder',
      targetId: folder._id,
      targetName: folder.name
    });

    res.status(200).json({
      success: true,
      message: 'Folder permanently deleted.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFolder,
  getFolders,
  getFolderBreadcrumbs,
  updateFolder,
  moveFolder,
  toggleFolderFavorite,
  trashFolder,
  deleteFolderPermanent
};
