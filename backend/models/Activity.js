const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        'upload',
        'download',
        'delete',
        'restore',
        'permanent_delete',
        'share',
        'revoke_share',
        'rename',
        'move',
        'tag',
        'favorite',
        'new_version',
        'version_restore',
        'collaborator_add',
        'collaborator_remove',
        'file_request_created',
        'file_request_upload'
      ],
      index: true
    },
    targetType: {
      type: String,
      enum: ['file', 'folder', 'share', 'file_request'],
      required: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true
    },
    targetName: {
      type: String,
      required: true
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ targetId: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
