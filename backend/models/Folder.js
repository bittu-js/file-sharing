const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Folder name is required'],
      trim: true,
      maxlength: [80, 'Folder name cannot exceed 80 characters']
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
      index: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Folder owner is required'],
      index: true
    },
    color: {
      type: String,
      default: 'blue' // blue, amber, emerald, purple, rose, slate
    },
    isTrash: {
      type: Boolean,
      default: false,
      index: true
    },
    isFavorite: {
      type: Boolean,
      default: false,
      index: true
    },
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
    ]
  },
  {
    timestamps: true
  }
);

// Compound index for browsing nested directory trees quickly
folderSchema.index({ owner: 1, parent: 1, isTrash: 1 });

module.exports = mongoose.model('Folder', folderSchema);
