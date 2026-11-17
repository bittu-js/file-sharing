const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createShare,
  getMyShares,
  getShareByToken,
  downloadSharedFile,
  previewSharedFile,
  revokeShare
} = require('../controllers/shareController');

// Public endpoints for shared files access
router.get('/:token', getShareByToken);
router.post('/:token/download', downloadSharedFile);
router.post('/:token/preview', previewSharedFile);

// Protected endpoints for managing shares
router.post('/', protect, createShare);
router.get('/', protect, getMyShares);
router.delete('/:id', protect, revokeShare);

module.exports = router;
