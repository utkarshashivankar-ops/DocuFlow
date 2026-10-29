const User = require('../models/User');
const Document = require('../models/Document');
const Notification = require('../models/Notification');
const ShareLink = require('../models/ShareLink');
const { scanAll } = require('../services/notificationEngine');
const asyncHandler = require('../utils/asyncHandler');

/** System-wide counts only - administrators never see users' document contents. */
exports.overview = asyncHandler(async (_req, res) => {
  const dayAgo = new Date(Date.now() - 86400000);
  const [users, admins, documents, byStatus, notifications24h, activeShares] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'admin' }),
    Document.countDocuments(),
    Document.aggregate([{ $group: { _id: '$processingStatus', count: { $sum: 1 } } }]),
    Notification.countDocuments({ createdAt: { $gte: dayAgo } }),
    ShareLink.countDocuments({ revokedAt: { $exists: false }, expiresAt: { $gt: new Date() } }),
  ]);
  res.json({
    success: true,
    overview: {
      users, admins, documents, notifications24h, activeShares,
      processing: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    },
  });
});

exports.runScan = asyncHandler(async (_req, res) => {
  const r = await scanAll();
  res.json({ success: true, created: r.created, skipped: r.skipped });
});
