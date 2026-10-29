const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { scanAll } = require('../services/notificationEngine');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// notifications the user switched off in-app are stored (for de-duplication) but never listed
const visible = (userId) => ({ userId, 'channels.inApp': true });

const toClient = (n) => ({
  id: String(n._id),
  documentId: n.documentId ? String(n.documentId) : null,
  type: n.type,
  title: n.title,
  message: n.message,
  daysRemaining: n.daysRemaining ?? null,
  recommendedAction: n.recommendedAction || null,
  read: n.read,
  channels: { email: Boolean(n.channels?.emailSentAt), push: Boolean(n.channels?.pushSentAt) },
  createdAt: n.createdAt,
});

exports.list = asyncHandler(async (req, res) => {
  const { unread, page, limit } = req.query;
  const filter = visible(req.user._id);
  if (unread === 'true') filter.read = false;
  const skip = (page - 1) * limit;
  const [total, items, unreadCount] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ ...visible(req.user._id), read: false }),
  ]);
  res.json({ success: true, notifications: items.map(toClient), unreadCount, pagination: { page, limit, total, hasMore: skip + items.length < total } });
});

exports.unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ ...visible(req.user._id), read: false });
  res.json({ success: true, count });
});

exports.markRead = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, 'Notification not found.', 'NOT_FOUND');
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { $set: { read: true } }, { new: true });
  if (!n) throw new ApiError(404, 'Notification not found.', 'NOT_FOUND');
  res.json({ success: true, notification: toClient(n) });
});

exports.markAllRead = asyncHandler(async (req, res) => {
  const r = await Notification.updateMany({ ...visible(req.user._id), read: false }, { $set: { read: true } });
  res.json({ success: true, updated: r.modifiedCount });
});

exports.remove = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, 'Notification not found.', 'NOT_FOUND');
  const r = await Notification.deleteOne({ _id: req.params.id, userId: req.user._id });
  if (!r.deletedCount) throw new ApiError(404, 'Notification not found.', 'NOT_FOUND');
  res.json({ success: true });
});

/** "Check my documents now" - runs the same engine the scheduler runs, for the signed-in user only. */
exports.scanMine = asyncHandler(async (req, res) => {
  const r = await scanAll({ userId: req.user._id });
  res.json({ success: true, created: r.created, skipped: r.skipped });
});
