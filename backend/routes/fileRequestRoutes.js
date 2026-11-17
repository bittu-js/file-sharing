const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const {
  createFileRequest,
  getMyFileRequests,
  revokeFileRequest,
  getPublicFileRequest,
  uploadToPublicFileRequest
} = require('../controllers/fileRequestController');

// Public file request portal endpoints
router.get('/public/:token', getPublicFileRequest);
router.post('/public/:token/upload', upload.array('files', 15), uploadToPublicFileRequest);

// Protected routes for managing requests
router.use(protect);
router.post('/', createFileRequest);
router.get('/', getMyFileRequests);
router.delete('/:id', revokeFileRequest);

module.exports = router;
