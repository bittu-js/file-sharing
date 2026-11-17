const mongoose = require('mongoose');

const fileRequestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Request title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    destinationFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null
    },
    requestToken: {
      type: String,
      required: true,
      unique: true,
      index: true
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
    submissionsCount: {
      type: Number,
      default: 0
    },
    submissions: [
      {
        file: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'File'
        },
        originalName: {
          type: String,
          required: true,
          trim: true
        },
        fileSize: {
          type: Number,
          required: true
        },
        fileType: {
          type: String,
          required: true
        },
        uploaderName: {
          type: String,
          required: true,
          trim: true
        },
        uploaderEmail: {
          type: String,
          required: true,
          trim: true,
          lowercase: true
        },
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
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
  },
  {
    timestamps: true
  }
);

// TTL index for automated expiry cleanup
fileRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('FileRequest', fileRequestSchema);
