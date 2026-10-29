const mongoose = require('mongoose');

const CATEGORIES = ['Identity', 'Insurance', 'Education', 'Financial', 'Legal', 'Other'];
const PROCESSING = ['uploading', 'processing', 'extracting', 'classifying', 'completed', 'failed'];

const versionSchema = new mongoose.Schema(
  {
    versionNumber: { type: Number, required: true },
    cloudinaryUrl: String,
    cloudinaryPublicId: String,
    cloudinaryResourceType: { type: String, default: 'image' },
    mimeType: String,
    fileSize: Number,
    uploadedAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    autoTitle: { type: Boolean, default: false }, // true until the user sets a title; lets OCR name the document
    documentType: { type: String, default: 'Other Document', trim: true, maxlength: 80 },
    category: { type: String, enum: CATEGORIES, default: 'Other' },

    // file (Cloudinary, delivered via signed "authenticated" URLs generated per request)
    cloudinaryUrl: String,
    cloudinaryPublicId: String,
    cloudinaryResourceType: { type: String, default: 'image' },
    originalName: String,
    mimeType: String,
    fileSize: Number,

    // OCR + extraction
    extractedText: { type: String, default: '' },
    ocrConfidence: Number,
    classificationConfidence: Number,
    classificationSource: { type: String, enum: ['auto', 'manual'], default: 'auto' },
    documentNumber: { type: String, trim: true },
    holderName: { type: String, trim: true },
    issueDate: Date,
    expiryDate: Date,
    importantDates: [{ _id: false, label: String, date: Date }],

    // pipeline state shown in the mobile app
    processingStatus: { type: String, enum: PROCESSING, default: 'processing' },
    processingError: String,

    // version history + sharing (filled by the next build; schema is ready)
    currentVersion: { type: Number, default: 1 },
    versions: [versionSchema],
    sharing: {
      isShared: { type: Boolean, default: false },
      lastSharedAt: Date,
    },
  },
  { timestamps: true }
);

// NOTE: no stored "status" field - it is derived from expiryDate (see utils/expiry.js)
documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ userId: 1, expiryDate: 1 });
documentSchema.index({ userId: 1, category: 1 });
documentSchema.index({ userId: 1, documentType: 1 });
documentSchema.index(
  { title: 'text', documentType: 'text', category: 'text', holderName: 'text', documentNumber: 'text', extractedText: 'text' },
  { weights: { title: 10, documentType: 8, holderName: 6, documentNumber: 6, category: 4, extractedText: 1 }, name: 'document_text_search' }
);

module.exports = mongoose.model('Document', documentSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.PROCESSING = PROCESSING;
