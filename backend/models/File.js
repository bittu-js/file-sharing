const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  versionNumber: {
    type: Number,
    required: true
  },
  storedName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  hash: {
    type: String,
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const fileSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true
    },
    storedName: {
      type: String,
      required: [true, 'Stored file name is required'],
      unique: true
    },
    fileType: {
      type: String,
      required: [true, 'File type is required']
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required']
    },
    filePath: {
      type: String,
      required: [true, 'File path is required']
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'File owner is required'],
      index: true
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
      index: true
    },
    hash: {
      type: String,
      default: null,
      index: true
    },
    version: {
      type: Number,
      default: 1
    },
    versions: [versionSchema],
    isFavorite: {
      type: Boolean,
      default: false,
      index: true
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        role: {
          type: String,
          enum: ['viewer', 'editor'],
          default: 'viewer'
        },
        invitedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    uploadDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    downloadCount: {
      type: Number,
      default: 0
    },
    isTrash: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// High performance compound indexes
fileSchema.index({ owner: 1, folder: 1, isTrash: 1, uploadDate: -1 });
fileSchema.index({ owner: 1, isFavorite: 1, isTrash: 1 });
fileSchema.index({ owner: 1, hash: 1 });
fileSchema.index({ 'collaborators.user': 1, isTrash: 1 });
fileSchema.index({ tags: 1, owner: 1 });

module.exports = mongoose.model('File', fileSchema);
