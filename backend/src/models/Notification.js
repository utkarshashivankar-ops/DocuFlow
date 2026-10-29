const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', index: true },
    type: { type: String, enum: ['expiry', 'processing', 'system'], default: 'expiry' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    daysRemaining: Number,
    thresholdDays: Number,
    recommendedAction: String,
    read: { type: Boolean, default: false },
    channels: {
      inApp: { type: Boolean, default: true },
      emailSentAt: Date,
      pushSentAt: Date,
    },
    // prevents duplicate reminders: userId + documentId + expiry date + threshold
    dedupeKey: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
