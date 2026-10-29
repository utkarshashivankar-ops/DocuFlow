const mongoose = require('mongoose');

const shareLinkSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true }, // only a hash of the token is stored
    expiresAt: { type: Date, required: true },
    revokedAt: Date,
    accessCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);
shareLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 }); // purge a week after expiry

module.exports = mongoose.model('ShareLink', shareLinkSchema);
