const Renewal = require('../models/Renewal');
const { renewalTemplate } = require('../utils/renewalGuide');
const { daysRemaining } = require('../utils/expiry');
const { config } = require('../config/env');

/** Get the renewal task for a document, creating it from the type's template the first time. */
async function ensureRenewal(doc, user) {
  const warning = user?.preferences?.expiryWarningDays ?? config.expiryWarningDays;
  let r = await Renewal.findOne({ documentId: doc._id });

  if (!r) {
    const t = renewalTemplate(doc.documentType);
    try {
      r = await Renewal.create({
        userId: doc.userId, documentId: doc._id, status: 'Not Started',
        checklist: t.checklist, steps: t.steps, officialUrl: t.officialUrl,
      });
    } catch (err) {
      if (err.code !== 11000) throw err; // two requests raced - use the winner
      r = await Renewal.findOne({ documentId: doc._id });
    }
    return r;
  }

  // A completed renewal starts a new cycle once the (new) expiry date is approaching again.
  const days = daysRemaining(doc.expiryDate, { tz: config.timezone });
  if (r.status === 'Completed' && days !== null && days <= warning) {
    const t = renewalTemplate(doc.documentType);
    r.status = 'Not Started';
    r.completedAt = undefined;
    r.checklist = t.checklist;
    r.steps = t.steps;
    if (!r.officialUrl) r.officialUrl = t.officialUrl;
    await r.save();
  }
  return r;
}

/** After an expiry date changes (manual edit, OCR of a new version): a future date means the renewal is done. */
async function syncAfterDateChange(doc, user) {
  if (!doc?.expiryDate) return;
  const r = await Renewal.findOne({ documentId: doc._id });
  if (!r || r.status === 'Completed') return;
  const warning = user?.preferences?.expiryWarningDays ?? config.expiryWarningDays;
  const days = daysRemaining(doc.expiryDate, { tz: config.timezone });
  if (days !== null && days > warning) {
    r.status = 'Completed';
    r.completedAt = new Date();
    r.checklist.forEach((c) => { c.done = true; });
    await r.save();
  }
}

const progress = (r) => ({ done: r.checklist.filter((c) => c.done).length, total: r.checklist.length });

function toRenewalClient(r) {
  const o = typeof r.toObject === 'function' ? r.toObject() : r;
  return {
    id: String(o._id),
    documentId: String(o.documentId?._id || o.documentId),
    status: o.status,
    checklist: o.checklist,
    steps: o.steps,
    officialUrl: o.officialUrl || '',
    notes: o.notes || '',
    completedAt: o.completedAt || null,
    progress: progress(o),
    updatedAt: o.updatedAt,
  };
}

module.exports = { ensureRenewal, syncAfterDateChange, toRenewalClient };
