const mongoose = require('mongoose');
const Document = require('../models/Document');
const { reprocess } = require('../services/documentProcessor');
const { toClient } = require('../services/documentSerializer');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const BUSY = ['processing', 'extracting', 'classifying'];

// POST /api/ocr/process  { documentId }  - (re)run OCR + classification for a stored document
exports.processDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.body;
  if (!mongoose.isValidObjectId(documentId)) throw new ApiError(404, 'Document not found.', 'NOT_FOUND');
  const doc = await Document.findOne({ _id: documentId, userId: req.user._id });
  if (!doc) throw new ApiError(404, 'Document not found.', 'NOT_FOUND');
  if (!doc.cloudinaryPublicId) throw new ApiError(400, 'This document has no stored file to process.', 'NO_FILE');

  const fresh = Date.now() - new Date(doc.updatedAt).getTime() < 3 * 60 * 1000;
  if (BUSY.includes(doc.processingStatus) && fresh) throw new ApiError(409, 'This document is already being processed.', 'ALREADY_PROCESSING');

  doc.processingStatus = 'processing';
  doc.processingError = undefined;
  await doc.save();

  res.status(202).json({ success: true, document: toClient(doc, req.user) });
  reprocess(doc).catch(async (err) => {
    console.error('[ocr] reprocess failed', err.message);
    await Document.updateOne({ _id: doc._id }, { $set: { processingStatus: 'failed', processingError: 'Could not re-read the stored file. Please try again.' } });
  });
});
