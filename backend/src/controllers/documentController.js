const path = require('path');
const mongoose = require('mongoose');
const Document = require('../models/Document');
const Renewal = require('../models/Renewal');
const Notification = require('../models/Notification');
const ShareLink = require('../models/ShareLink');
const cloudinary = require('../services/cloudinaryService');
const { runPipeline } = require('../services/documentProcessor');
const { toClient } = require('../services/documentSerializer');
const { expiryRanges, parseDateOnly } = require('../utils/expiry');
const { syncAfterDateChange } = require('../services/renewalService');
const { config } = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const warningDays = (user) => user.preferences?.expiryWarningDays ?? config.expiryWarningDays;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Load a document ONLY if it belongs to the signed-in user. Unknown and foreign ids are both reported as 404. */
async function findOwned(req, projection) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, 'Document not found.', 'NOT_FOUND');
  const doc = await Document.findOne({ _id: id, userId: req.user._id }, projection);
  if (!doc) throw new ApiError(404, 'Document not found.', 'NOT_FOUND');
  return doc;
}

function dateOrThrow(value, label) {
  const d = parseDateOnly(value);
  if (d === undefined) throw new ApiError(400, `${label} must be a valid date in YYYY-MM-DD format.`, 'VALIDATION_ERROR');
  return d; // Date | null
}

function checkOrder(issue, expiry) {
  if (issue && expiry && expiry < issue) throw new ApiError(400, 'Expiry date cannot be before the issue date.', 'VALIDATION_ERROR');
}

// ---------- create ----------
exports.uploadDocument = asyncHandler(async (req, res) => {
  const file = req.file;
  const { title, category } = req.body;
  const originalName = path.basename(file.originalname || 'document').slice(0, 120);

  const asset = await cloudinary.uploadBuffer(file.buffer, { userId: req.user._id });
  const resourceType = asset.resource_type || 'image';

  let doc;
  try {
    doc = await Document.create({
      userId: req.user._id,
      title: title || path.parse(originalName).name.slice(0, 160) || 'Untitled document',
      autoTitle: !title,
      category: category || 'Other',
      classificationSource: category ? 'manual' : 'auto',
      cloudinaryUrl: asset.secure_url,
      cloudinaryPublicId: asset.public_id,
      cloudinaryResourceType: resourceType,
      originalName,
      mimeType: file.mimetype,
      fileSize: file.size,
      processingStatus: 'processing',
      currentVersion: 1,
      versions: [{
        versionNumber: 1, cloudinaryUrl: asset.secure_url, cloudinaryPublicId: asset.public_id,
        cloudinaryResourceType: resourceType, mimeType: file.mimetype, fileSize: file.size,
        uploadedAt: new Date(), updatedBy: req.user._id, metadata: { originalName },
      }],
    });
  } catch (err) {
    await cloudinary.destroy(asset.public_id, resourceType); // do not leave an orphaned file
    throw err;
  }

  // Respond immediately; the app polls GET /documents/:id to show OCR progress.
  res.status(201).json({ success: true, document: toClient(doc, req.user) });
  runPipeline(doc._id, file.buffer, { mimetype: file.mimetype, filename: originalName });
});

exports.createDocument = asyncHandler(async (req, res) => {
  const b = req.body;
  const issue = dateOrThrow(b.issueDate, 'Issue date');
  const expiry = dateOrThrow(b.expiryDate, 'Expiry date');
  checkOrder(issue, expiry);
  const doc = await Document.create({
    userId: req.user._id,
    title: b.title,
    documentType: b.documentType || 'Other Document',
    category: b.category,
    holderName: b.holderName || undefined,
    documentNumber: b.documentNumber || undefined,
    issueDate: issue || undefined,
    expiryDate: expiry || undefined,
    classificationSource: 'manual',
    processingStatus: 'completed',
  });
  res.status(201).json({ success: true, document: toClient(doc, req.user) });
});

// ---------- read ----------
exports.listDocuments = asyncHandler(async (req, res) => {
  const { category, status, sort, page, limit } = req.query;
  const filter = { userId: req.user._id };
  if (category && category !== 'All') filter.category = category;

  const { today, soonEnd } = expiryRanges(warningDays(req.user), { tz: config.timezone });
  if (status === 'expired') filter.expiryDate = { $lt: today };
  else if (status === 'expiring') filter.expiryDate = { $gte: today, $lte: soonEnd };
  else if (status === 'active') filter.$or = [{ expiryDate: null }, { expiryDate: { $gt: soonEnd } }];

  const skip = (page - 1) * limit;
  const total = await Document.countDocuments(filter);

  let docs;
  if (sort === 'expiry') {
    // soonest expiry first; documents without an expiry date go last
    docs = await Document.aggregate([
      { $match: filter },
      { $addFields: { hasExpiry: { $cond: [{ $ifNull: ['$expiryDate', false] }, 1, 0] } } },
      { $sort: { hasExpiry: -1, expiryDate: 1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      { $project: { extractedText: 0, versions: 0 } },
    ]);
  } else {
    docs = await Document.find(filter, '-extractedText -versions')
      .sort({ createdAt: sort === 'oldest' ? 1 : -1 })
      .skip(skip)
      .limit(limit);
  }

  res.json({
    success: true,
    documents: docs.map((d) => toClient(d, req.user)),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1, hasMore: skip + docs.length < total },
  });
});

exports.searchDocuments = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const tokens = q.split(/\s+/).filter(Boolean).slice(0, 6);
  const fields = ['title', 'documentType', 'category', 'holderName', 'documentNumber', 'originalName', 'extractedText'];

  // every word must match at least one field (case-insensitive, partial)
  const filter = {
    userId: req.user._id,
    $and: tokens.map((t) => {
      const rx = new RegExp(escapeRegex(t), 'i');
      return { $or: fields.map((f) => ({ [f]: rx })) };
    }),
  };

  const docs = await Document.find(filter).sort({ createdAt: -1 }).limit(60);
  const lowTokens = tokens.map((t) => t.toLowerCase());

  const scored = docs.map((d) => {
    const head = `${d.title} ${d.documentType} ${d.category} ${d.holderName || ''} ${d.documentNumber || ''}`.toLowerCase();
    const score = lowTokens.reduce((n, t) => n + (head.includes(t) ? 1 : 0), 0);
    const o = d.toObject();
    if (score === 0 && o.extractedText) {
      // matched only inside the OCR text -> show where
      const lowText = o.extractedText.toLowerCase();
      const idx = lowText.indexOf(lowTokens[0]);
      if (idx >= 0) {
        const start = Math.max(0, idx - 40);
        o.snippet = `${start > 0 ? '…' : ''}${o.extractedText.slice(start, idx + 80).replace(/\s+/g, ' ').trim()}…`;
      }
    }
    delete o.extractedText;
    delete o.versions;
    return { o, score };
  });
  scored.sort((a, b) => b.score - a.score);

  res.json({ success: true, query: q, count: scored.length, documents: scored.slice(0, 40).map((s) => toClient(s.o, req.user)) });
});

function rangeList(kind) {
  return asyncHandler(async (req, res) => {
    const { today, soonEnd } = expiryRanges(warningDays(req.user), { tz: config.timezone });
    const filter = { userId: req.user._id };
    filter.expiryDate = kind === 'expired' ? { $lt: today } : { $gte: today, $lte: soonEnd };
    const docs = await Document.find(filter, '-extractedText -versions').sort({ expiryDate: kind === 'expired' ? -1 : 1 });
    res.json({ success: true, count: docs.length, documents: docs.map((d) => toClient(d, req.user)) });
  });
}
exports.expiringDocuments = rangeList('expiring');
exports.expiredDocuments = rangeList('expired');

exports.stats = asyncHandler(async (req, res) => {
  const warning = warningDays(req.user);
  const { today, soonEnd } = expiryRanges(warning, { tz: config.timezone });

  const [agg] = await Document.aggregate([
    { $match: { userId: req.user._id } },
    {
      $facet: {
        total: [{ $count: 'n' }],
        expired: [{ $match: { expiryDate: { $lt: today } } }, { $count: 'n' }],
        expiring: [{ $match: { expiryDate: { $gte: today, $lte: soonEnd } } }, { $count: 'n' }],
        categories: [{ $group: { _id: '$category', count: { $sum: 1 } } }],
      },
    },
  ]);
  const n = (arr) => arr[0]?.n || 0;
  const total = n(agg.total);
  const expired = n(agg.expired);
  const expiringSoon = n(agg.expiring);

  const categories = Object.fromEntries(Document.CATEGORIES.map((c) => [c, 0]));
  agg.categories.forEach((c) => { if (c._id in categories) categories[c._id] = c.count; });

  const recent = await Document.find({ userId: req.user._id }, '-extractedText -versions').sort({ createdAt: -1 }).limit(5);

  res.json({
    success: true,
    stats: { total, expired, expiringSoon, active: total - expired - expiringSoon, categories, warningDays: warning },
    recent: recent.map((d) => toClient(d, req.user)),
  });
});

exports.getDocument = asyncHandler(async (req, res) => {
  const doc = await findOwned(req);
  res.json({ success: true, document: toClient(doc, req.user, { includeText: true }) });
});

// ---------- update / delete ----------
exports.updateDocument = asyncHandler(async (req, res) => {
  const doc = await findOwned(req);
  const b = req.body;

  if (b.title !== undefined) { doc.title = b.title; doc.autoTitle = false; }
  if (b.category !== undefined && b.category !== doc.category) { doc.category = b.category; doc.classificationSource = 'manual'; }
  if (b.documentType !== undefined && b.documentType !== doc.documentType) { doc.documentType = b.documentType; doc.classificationSource = 'manual'; }
  if (b.holderName !== undefined) doc.holderName = b.holderName || undefined;
  if (b.documentNumber !== undefined) doc.documentNumber = b.documentNumber || undefined;

  const issue = b.issueDate !== undefined ? dateOrThrow(b.issueDate, 'Issue date') : doc.issueDate;
  const expiry = b.expiryDate !== undefined ? dateOrThrow(b.expiryDate, 'Expiry date') : doc.expiryDate;
  checkOrder(issue, expiry);
  if (b.issueDate !== undefined) doc.issueDate = issue || undefined;
  if (b.expiryDate !== undefined) doc.expiryDate = expiry || undefined;

  await doc.save();
  if (b.expiryDate !== undefined) await syncAfterDateChange(doc, req.user).catch(() => {});
  res.json({ success: true, document: toClient(doc, req.user, { includeText: true }) });
});

exports.deleteDocument = asyncHandler(async (req, res) => {
  const doc = await findOwned(req);

  const assets = new Map();
  if (doc.cloudinaryPublicId) assets.set(doc.cloudinaryPublicId, doc.cloudinaryResourceType);
  (doc.versions || []).forEach((v) => v.cloudinaryPublicId && assets.set(v.cloudinaryPublicId, v.cloudinaryResourceType));
  await Promise.all([...assets].map(([id, type]) => cloudinary.destroy(id, type)));

  await Promise.all([
    Renewal.deleteMany({ documentId: doc._id }),
    Notification.deleteMany({ documentId: doc._id }),
    ShareLink.deleteMany({ documentId: doc._id }),
  ]);
  await doc.deleteOne();
  res.json({ success: true, message: 'Document deleted.' });
});

exports.findOwned = findOwned;
