const mongoose = require('mongoose');
const Document = require('../models/Document');
const Renewal = require('../models/Renewal');
const { ensureRenewal, toRenewalClient } = require('../services/renewalService');
const { toClient } = require('../services/documentSerializer');
const { expiryRanges } = require('../utils/expiry');
const { recommendedAction } = require('../utils/renewalGuide');
const { config } = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const LIST_FIELDS = '-extractedText -versions';
const warningDays = (u) => u.preferences?.expiryWarningDays ?? config.expiryWarningDays;

const withDoc = (r, doc, user) => ({ ...toRenewalClient(r), recommendedAction: recommendedAction(doc.documentType), document: toClient(doc, user) });

/**
 * Renewal Center overview: every expired / expiring document gets a renewal task (created on demand),
 * plus any task the user already started. Sorted: expired first, then by days remaining.
 */
exports.overview = asyncHandler(async (req, res) => {
  const { soonEnd } = expiryRanges(warningDays(req.user), { tz: config.timezone });
  const due = await Document.find({ userId: req.user._id, expiryDate: { $ne: null, $lte: soonEnd } }, LIST_FIELDS).limit(60);

  await Promise.all(due.map((d) => ensureRenewal(d, req.user)));

  const renewals = await Renewal.find({ userId: req.user._id });
  const ids = renewals.map((r) => r.documentId);
  const docs = await Document.find({ _id: { $in: ids } }, LIST_FIELDS);
  const byId = new Map(docs.map((d) => [String(d._id), d]));

  const items = renewals
    .map((r) => ({ r, d: byId.get(String(r.documentId)) }))
    .filter((x) => x.d)
    // a finished task whose document is healthy again is history, not "needs attention"
    .filter((x) => x.r.status !== 'Completed' || x.d.expiryDate <= soonEnd)
    .map((x) => withDoc(x.r, x.d, req.user))
    .sort((a, b) => (a.document.daysRemaining ?? 9999) - (b.document.daysRemaining ?? 9999));

  const count = (s) => items.filter((i) => i.status === s).length;
  res.json({
    success: true,
    summary: { total: items.length, notStarted: count('Not Started'), inProgress: count('In Progress'), completed: count('Completed') },
    items,
  });
});

async function loadOwnedDoc(userId, documentId) {
  if (!mongoose.isValidObjectId(documentId)) throw new ApiError(404, 'Document not found.', 'NOT_FOUND');
  const doc = await Document.findOne({ _id: documentId, userId }, LIST_FIELDS);
  if (!doc) throw new ApiError(404, 'Document not found.', 'NOT_FOUND');
  return doc;
}

/** Renewal task for one document (created from the document-type template on first open). */
exports.forDocument = asyncHandler(async (req, res) => {
  const doc = await loadOwnedDoc(req.user._id, req.params.documentId);
  const r = await ensureRenewal(doc, req.user);
  res.json({ success: true, renewal: withDoc(r, doc, req.user) });
});

exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, 'Renewal not found.', 'NOT_FOUND');
  const r = await Renewal.findOne({ _id: id, userId: req.user._id });
  if (!r) throw new ApiError(404, 'Renewal not found.', 'NOT_FOUND');
  const b = req.body;

  if (b.checklist) {
    r.checklist = b.checklist;
    // ticking the first item implicitly starts the task
    if (r.status === 'Not Started' && b.checklist.some((c) => c.done) && b.status === undefined) r.status = 'In Progress';
  }
  if (b.notes !== undefined) r.notes = b.notes;
  if (b.officialUrl !== undefined) r.officialUrl = b.officialUrl;
  if (b.status !== undefined && b.status !== r.status) {
    r.status = b.status;
    r.completedAt = b.status === 'Completed' ? new Date() : undefined;
  }
  await r.save();

  const doc = await loadOwnedDoc(req.user._id, r.documentId);
  res.json({ success: true, renewal: withDoc(r, doc, req.user) });
});
