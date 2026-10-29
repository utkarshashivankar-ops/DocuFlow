const mongoose = require('mongoose');

const renewalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, unique: true },
    status: { type: String, enum: ['Not Started', 'In Progress', 'Completed'], default: 'Not Started' },
    checklist: [{ _id: false, label: String, done: { type: Boolean, default: false } }],
    steps: [String],
    officialUrl: { type: String, default: '' }, // configurable - never invented
    notes: String,
    completedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Renewal', renewalSchema);
