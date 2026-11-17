const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const shareSchema = new mongoose.Schema({
  file: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: [true, 'Shared file reference is required'],
    index: true
  },
  shareToken: {
    type: String,
    required: [true, 'Share token is required'],
    unique: true,
    index: true
  },
  passwordHash: {
    type: String,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Helper method to verify share password
shareSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.passwordHash) return true;
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Automated TTL index for link expiry
shareSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Share', shareSchema);
