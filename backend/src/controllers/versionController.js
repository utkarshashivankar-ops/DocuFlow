const path = require('path');
const Document = require('../models/Document');
const cloudinary = require('../services/cloudinaryService');
const { runPipeline, reprocess } = require('../services/documentProcessor');
const { toClient } = require('../services/documentSerializer');
const { findOwned } = require('./documentController');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/** Remember what the outgoing version looked like, so a rollback can restore its dates too. */
function snapshotActive(doc) {
  const active = doc.versions.find((v) => v.versionNumber === doc.currentVersion);
  if (!active) return;
  active.metadata = {
    ...(active.metadata || {}),
    expiryDate: doc.expiryDate || null,
    issueDate: doc.issueDate || null,
    documentNumber: doc.documentNumber || null,
    holderName: doc.holderName || null,
  };
  doc.markModified('versions');
}

const versionToClient = (v, doc) => ({
  versionNumber: v.versionNumber,
  isCurrent: v.versionNumber === doc.currentVersion,
  uploadedAt: v.uploadedAt,
  mimeType: v.mimeType,
  fileSize: v.fileSize,
  originalName: v.metadata?.originalName || null,
  expiryDate: v.versionNumber === doc.currentVersion ? doc.expiryDate || null : v.metadata?.expiryDate || null,
  documentNumber: v.versionNumber === doc.currentVersion ? doc.documentNumber || null : v.metadata?.documentNumber || null,
  fileUrl: cloudinary.signedUrl(v.cloudinaryPublicId, v.cloudinaryResourceType),
  thumbnailUrl: cloudinary.thumbnailUrl(v.cloudinaryPublicId, v.cloudinaryResourceType),
});

exports.list = asyncHandler(async (req, res) => {
  const doc = await findOwned(req, '-extractedText');
  const versions = [...doc.versions].sort((a, b) => b.versionNumber - a.versionNumber).map((v) => versionToClient(v, doc));
  res.json({ success: true, currentVersion: doc.currentVersion, count: versions.length, versions });
});

/** Upload a new file for an existing document (e.g. the renewed policy). The old file stays in the history. */
exports.add = asyncHandler(async (req, res) => {
  const doc = await findOwned(req, '-extractedText');
  const file = req.file;
  const originalName = path.basename(file.originalname || 'document').slice(0, 120);

  const asset = await cloudinary.uploadBuffer(file.buffer, { userId: req.user._id });
  const resourceType = asset.resource_type || 'image';

  try {
    const hadFile = Boolean(doc.cloudinaryPublicId) && doc.versions.length > 0;
    const next = hadFile ? Math.max(...doc.versions.map((v) => v.versionNumber)) + 1 : 1;
    if (hadFile) snapshotActive(doc);

    doc.versions.push({
      versionNumber: next, cloudinaryUrl: asset.secure_url, cloudinaryPublicId: asset.public_id,
      cloudinaryResourceType: resourceType, mimeType: file.mimetype, fileSize: file.size,
      uploadedAt: new Date(), updatedBy: req.user._id, metadata: { originalName },
    });
    doc.cloudinaryUrl = asset.secure_url;
    doc.cloudinaryPublicId = asset.public_id;
    doc.cloudinaryResourceType = resourceType;
    doc.originalName = originalName;
    doc.mimeType = file.mimetype;
    doc.fileSize = file.size;
    doc.currentVersion = next;
    doc.processingStatus = 'processing';
    doc.processingError = undefined;
    await doc.save();
  } catch (err) {
    await cloudinary.destroy(asset.public_id, resourceType); // never leave an orphan if the save failed
    throw err;
  }

  res.status(201).json({ success: true, document: toClient(doc, req.user) });
  runPipeline(doc._id, file.buffer, { mimetype: file.mimetype, filename: originalName, newVersion: true });
});

/** Roll back: make an older version the current one (its dates come back too) and re-read its text. */
exports.restore = asyncHandler(async (req, res) => {
  const doc = await findOwned(req, '-extractedText');
  const n = Number(req.params.version);
  const v = doc.versions.find((x) => x.versionNumber === n);
  if (!Number.isInteger(n) || !v) throw new ApiError(404, 'That version does not exist.', 'NOT_FOUND');
  if (n === doc.currentVersion) throw new ApiError(400, 'That version is already the current one.', 'VALIDATION_ERROR');

  snapshotActive(doc);
  doc.cloudinaryUrl = v.cloudinaryUrl;
  doc.cloudinaryPublicId = v.cloudinaryPublicId;
  doc.cloudinaryResourceType = v.cloudinaryResourceType;
  doc.mimeType = v.mimeType;
  doc.fileSize = v.fileSize;
  doc.originalName = v.metadata?.originalName || doc.originalName;
  doc.currentVersion = n;
  const m = v.metadata || {};
  if ('expiryDate' in m) doc.expiryDate = m.expiryDate || undefined;
  if ('issueDate' in m) doc.issueDate = m.issueDate || undefined;
  if ('documentNumber' in m) doc.documentNumber = m.documentNumber || undefined;
  if ('holderName' in m) doc.holderName = m.holderName || undefined;
  doc.processingStatus = 'processing';
  await doc.save();

  res.json({ success: true, document: toClient(doc, req.user) });
  reprocess(doc).catch((e) => console.error('[versions] reprocess failed:', e.message));
});

exports.versionToClient = versionToClient;
exports.Document = Document;
