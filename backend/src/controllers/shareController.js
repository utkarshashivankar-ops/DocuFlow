const crypto = require('crypto');
const axios = require('axios');
const mongoose = require('mongoose');
const Document = require('../models/Document');
const ShareLink = require('../models/ShareLink');
const cloudinary = require('../services/cloudinaryService');
const { findOwned } = require('./documentController');
const { config } = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');
const TOKEN_RX = /^[A-Za-z0-9_-]{20,64}$/;
const HOUR = 3600 * 1000;
const activeFilter = (extra = {}) => ({ revokedAt: { $exists: false }, expiresAt: { $gt: new Date() }, ...extra });

async function refreshSharedFlag(docId) {
  const n = await ShareLink.countDocuments(activeFilter({ documentId: docId }));
  await Document.updateOne({ _id: docId }, { $set: { 'sharing.isShared': n > 0 } });
}

// ---------- owner endpoints (JWT) ----------
exports.create = asyncHandler(async (req, res) => {
  const doc = await findOwned(req, '-extractedText -versions');
  if (!doc.cloudinaryPublicId) throw new ApiError(400, 'This document has no file to share yet.', 'NO_FILE');

  const token = crypto.randomBytes(32).toString('base64url'); // 256-bit, shown once, only its hash is stored
  const expiresAt = new Date(Date.now() + req.body.expiresInHours * HOUR);
  const link = await ShareLink.create({ userId: req.user._id, documentId: doc._id, tokenHash: hashToken(token), expiresAt });
  await Document.updateOne({ _id: doc._id }, { $set: { 'sharing.isShared': true, 'sharing.lastSharedAt': new Date() } });

  res.status(201).json({
    success: true,
    share: { id: String(link._id), url: `${config.publicUrl}/s/${token}`, expiresAt, accessCount: 0 },
    note: 'Copy or send this link now - for security it cannot be shown again. You can revoke it at any time.',
  });
});

exports.list = asyncHandler(async (req, res) => {
  const doc = await findOwned(req, '_id');
  const links = await ShareLink.find(activeFilter({ documentId: doc._id, userId: req.user._id })).sort({ createdAt: -1 });
  res.json({
    success: true,
    shares: links.map((l) => ({ id: String(l._id), createdAt: l.createdAt, expiresAt: l.expiresAt, accessCount: l.accessCount })),
  });
});

exports.revoke = asyncHandler(async (req, res) => {
  const doc = await findOwned(req, '_id');
  if (!mongoose.isValidObjectId(req.params.linkId)) throw new ApiError(404, 'Link not found.', 'NOT_FOUND');
  const link = await ShareLink.findOneAndUpdate(
    { _id: req.params.linkId, documentId: doc._id, userId: req.user._id },
    { $set: { revokedAt: new Date() } }
  );
  if (!link) throw new ApiError(404, 'Link not found.', 'NOT_FOUND');
  await refreshSharedFlag(doc._id);
  res.json({ success: true, message: 'Link revoked. It no longer works.' });
});

// ---------- public endpoints (anyone holding the link) ----------
async function resolve(token) {
  const bad = () => new ApiError(404, 'This link is invalid, has expired or was revoked.', 'LINK_INVALID');
  if (!TOKEN_RX.test(token || '')) throw bad();
  const link = await ShareLink.findOne({ tokenHash: hashToken(token) });
  if (!link || link.revokedAt || link.expiresAt <= new Date()) throw bad();
  const doc = await Document.findById(link.documentId, 'title documentType category mimeType originalName cloudinaryPublicId cloudinaryResourceType');
  if (!doc || !doc.cloudinaryPublicId) throw bad();
  return { link, doc };
}

exports.meta = asyncHandler(async (req, res) => {
  const { link, doc } = await resolve(req.params.token);
  res.json({
    success: true,
    document: { title: doc.title, documentType: doc.documentType, category: doc.category, mimeType: doc.mimeType },
    expiresAt: link.expiresAt,
  });
});

/** The file is streamed through the API (Cloudinary stays private), so revoking a link takes effect immediately. */
exports.file = asyncHandler(async (req, res) => {
  const { link, doc } = await resolve(req.params.token);
  const url = cloudinary.signedUrl(doc.cloudinaryPublicId, doc.cloudinaryResourceType);
  const upstream = await axios.get(url, { responseType: 'stream', timeout: 30000 }).catch(() => {
    throw new ApiError(502, 'The file could not be retrieved. Please try again.', 'STORAGE_FAILED');
  });

  await ShareLink.updateOne({ _id: link._id }, { $inc: { accessCount: 1 } });
  const safeName = (doc.originalName || 'document').replace(/[^\w.\- ]/g, '_').slice(0, 100);
  res.set({
    'Content-Type': doc.mimeType || 'application/octet-stream',
    'Content-Disposition': `inline; filename="${safeName}"`,
    'Cache-Control': 'no-store',
  });
  upstream.data.on('error', () => res.destroy());
  upstream.data.pipe(res);
});

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const page = (body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="robots" content="noindex"/><title>DocuFlow shared document</title><style>body{font-family:system-ui,sans-serif;background:#F9FAFB;color:#111827;margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center}.c{background:#fff;border:1px solid #E5E7EB;border-radius:16px;padding:28px;max-width:420px;width:90%;text-align:center}h1{font-size:20px;margin:0 0 6px}p{color:#6B7280;font-size:14px}a.b{display:inline-block;margin-top:16px;background:#4F46E5;color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;font-weight:600}.logo{color:#4F46E5;font-weight:800;margin-bottom:14px}</style></head><body><div class="c"><div class="logo">DocuFlow</div>${body}</div></body></html>`;

/** Human-friendly landing page for a shared link. */
exports.landing = asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const { link, doc } = await resolve(req.params.token);
    res.send(page(`<h1>${esc(doc.title)}</h1><p>${esc(doc.documentType)} · ${esc(doc.category)}</p><p>This link expires on ${esc(link.expiresAt.toUTCString())}.</p><a class="b" href="/api/shared/${esc(req.params.token)}/file">Open document</a>`));
  } catch (err) {
    if (!err.isApiError) throw err;
    res.status(404).send(page('<h1>Link unavailable</h1><p>This link is invalid, has expired or was revoked by the owner.</p>'));
  }
});
