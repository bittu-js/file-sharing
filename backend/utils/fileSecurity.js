const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Sanitize a filename to prevent directory traversal or filesystem issues
 */
const sanitizeFilename = (filename) => {
  if (!filename) return 'unnamed_file';
  // Strip null bytes and control chars
  let clean = filename.replace(/[\x00-\x1f\x80-\x9f]/g, '');
  // Normalize and take only the base name (prevents ../ or path traversal in original name)
  clean = path.basename(clean);
  // Replace dangerous characters
  clean = clean.replace(/[^a-zA-Z0-9._\-\s()]/g, '_').trim();
  return clean || 'unnamed_file';
};

/**
 * Generate a cryptographically secure random token for public sharing
 */
const generateShareToken = (bytes = 20) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Validate and safely resolve file path within uploads directory
 */
const getSafeFilePath = (storedName) => {
  const safeBaseName = path.basename(storedName);
  const resolved = path.resolve(UPLOADS_DIR, safeBaseName);
  
  // Guard against path traversal out of uploads directory
  if (!resolved.startsWith(UPLOADS_DIR)) {
    throw new Error('Access denied: Invalid file path traversal detected.');
  }
  return resolved;
};

/**
 * Calculate SHA-256 hash of a file for duplicate detection and integrity
 */
const calculateFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
};

module.exports = {
  UPLOADS_DIR,
  sanitizeFilename,
  generateShareToken,
  getSafeFilePath,
  calculateFileHash
};
