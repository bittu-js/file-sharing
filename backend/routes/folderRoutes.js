const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createFolder,
  getFolders,
  getFolderBreadcrumbs,
  updateFolder,
  moveFolder,
  toggleFolderFavorite,
  trashFolder,
  deleteFolderPermanent
} = require('../controllers/folderController');

router.use(protect);

router.post('/', createFolder);
router.get('/', getFolders);
router.get('/:id/breadcrumbs', getFolderBreadcrumbs);
router.patch('/:id', updateFolder);
router.patch('/:id/move', moveFolder);
router.patch('/:id/favorite', toggleFolderFavorite);
router.patch('/:id/trash', trashFolder);
router.delete('/:id', deleteFolderPermanent);

module.exports = router;
