const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { UPLOADS_DIR, sanitizeFilename } = require('../utils/fileSecurity');

// Maximum file size: 50 MB
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE, 10) || 50 * 1024 * 1024;

// Configure disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomHex.ext
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  // Disallow executable scripts / dangerous binaries
  const blockedExtensions = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.vbs', '.com'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (blockedExtensions.includes(ext)) {
    return cb(
      new Error(`Uploading executable files (${ext}) is prohibited for security reasons.`),
      false
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter
});

module.exports = upload;
