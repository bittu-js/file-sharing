const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/fileController');

// All file routes are protected
router.use(protect);

// Collections & Filters (place before /:id parameterized routes)
router.get('/favorites', getFavorites);
router.get('/recent', getRecentFiles);
router.get('/shared-with-me', getSharedWithMe);
router.get('/shared-by-me', getSharedByMe);
router.post('/check-duplicate', checkDuplicate);

// Bulk Operations
router.post('/bulk/download', bulkDownload);
router.post('/bulk/move', bulkMove);
router.post('/bulk/trash', bulkTrash);
router.post('/bulk/restore', bulkRestore);
router.post('/bulk/delete', bulkDelete);

// Trash Actions
router.post('/trash/empty', emptyTrash);
router.post('/trash/restore-all', restoreAllTrash);

// File Uploads
router.post('/upload', upload.array('files', 15), uploadFiles);
router.get('/', getFiles);

// Versioning routes
router.post('/:id/versions', upload.single('file'), uploadNewVersion);
router.get('/:id/versions', getFileVersions);
router.post('/:id/versions/:vNum/restore', restoreFileVersion);
router.get('/:id/versions/:vNum/download', downloadFileVersion);

// Metadata & Movement
router.patch('/:id/move', moveFile);
router.patch('/:id/tags', updateFileTags);
router.patch('/:id/favorite', toggleFileFavorite);

// Collaborators
router.post('/:id/collaborators', addCollaborator);
router.delete('/:id/collaborators/:userId', removeCollaborator);

// Base file routes
router.get('/:id', getFileById);
router.get('/:id/download', downloadFile);
router.get('/:id/preview', previewFile);
router.patch('/:id/trash', toggleTrash);
router.delete('/:id', deleteFile);

module.exports = router;
