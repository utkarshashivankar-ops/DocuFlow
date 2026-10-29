const cloudinary = require('./cloudinaryService');
const { computeStatus, daysRemaining } = require('../utils/expiry');
const { config } = require('../config/env');

/** Shape a Mongoose document for the client: derived status, signed URLs, no storage internals. */
function toClient(doc, user, { includeText = false } = {}) {
  const o = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  const warning = user?.preferences?.expiryWarningDays ?? config.expiryWarningDays;
  const opts = { tz: config.timezone };

  const out = {
    id: String(o._id),
    title: o.title,
    documentType: o.documentType,
    category: o.category,
    holderName: o.holderName || null,
    documentNumber: o.documentNumber || null,
    issueDate: o.issueDate || null,
    expiryDate: o.expiryDate || null,
    status: computeStatus(o.expiryDate, warning, opts),
    daysRemaining: daysRemaining(o.expiryDate, opts),
    importantDates: o.importantDates || [],
    processingStatus: o.processingStatus,
    processingError: o.processingError || null,
    classificationSource: o.classificationSource,
    classificationConfidence: o.classificationConfidence ?? null,
    ocrConfidence: o.ocrConfidence ?? null,
    mimeType: o.mimeType,
    originalName: o.originalName,
    fileSize: o.fileSize,
    currentVersion: o.currentVersion,
    versionCount: o.versions ? o.versions.length : undefined,
    isShared: Boolean(o.sharing?.isShared),
    fileUrl: cloudinary.signedUrl(o.cloudinaryPublicId, o.cloudinaryResourceType),
    thumbnailUrl: cloudinary.thumbnailUrl(o.cloudinaryPublicId, o.cloudinaryResourceType),
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
  if (includeText) out.extractedText = o.extractedText || '';
  if (o.snippet) out.snippet = o.snippet;
  return out;
}

module.exports = { toClient };
