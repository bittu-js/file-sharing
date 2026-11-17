const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getActivities, getFileActivities } = require('../controllers/activityController');

router.use(protect);

router.get('/', getActivities);
router.get('/file/:fileId', getFileActivities);

module.exports = router;
