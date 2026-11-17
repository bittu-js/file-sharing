const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getDashboardStats, updateStorageQuota } = require('../controllers/statsController');

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.patch('/quota', updateStorageQuota);

module.exports = router;
