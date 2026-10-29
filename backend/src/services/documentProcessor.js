const axios = require('axios');
const Document = require('../models/Document');
const { runOcr, classifyText } = require('./pythonClient');
const cloudinary = require('./cloudinaryService');
const { parseDateOnly } = require('../utils/expiry');
const { syncAfterDateChange } = require('./renewalService');

const VALID_CATEGORIES = Document.CATEGORIES;

async function setStage(docId, processingStatus, extra = {}) {
  await Document.updateOne({ _id: docId }, { $set: { processingStatus, ...extra } });
}

/**
 * Background pipeline:  processing -> extracting (OCR) -> classifying -> completed | failed
 * The document is already saved + stored in Cloudinary before this runs, so a failure here never loses the upload.
 */
async function runPipeline(docId, buffer, { mimetype, filename, newVersion = false }) {
  try {
    await setStage(docId, 'extracting', { processingError: null });
    const ocr = await runOcr(buffer, { mimetype, filename });

    await setStage(docId, 'classifying', { extractedText: ocr.text || '', ocrConfidence: ocr.confidence });
    const cls = await classifyText(ocr.text || '');

    const doc = await Document.findById(docId);
    if (!doc) return; // deleted while processing

    const manual = doc.classificationSource === 'manual';
    const set = { processingStatus: 'completed', processingError: null, classificationConfidence: cls.confidence };

    if (!manual) {
      set.documentType = cls.documentType;
      set.category = VALID_CATEGORIES.includes(cls.category) ? cls.category : 'Other';
    } else if (cls.category === doc.category && doc.documentType === 'Other Document') {
      set.documentType = cls.documentType; // user picked the category; still fill in the specific type if it agrees
    }
    if (doc.autoTitle && cls.documentType !== 'Other Document') set.title = cls.documentType;
    const issue = parseDateOnly(cls.issueDate);
    const expiry = parseDateOnly(cls.expiryDate);
    // A newly uploaded version (e.g. the renewed passport) replaces the old values; a normal run only fills blanks.
    if (cls.holderName && (newVersion || !doc.holderName)) set.holderName = cls.holderName;
    if (cls.documentNumber && (newVersion || !doc.documentNumber)) set.documentNumber = cls.documentNumber;
    if (issue && (newVersion || !doc.issueDate)) set.issueDate = issue;
    if (expiry && (newVersion || !doc.expiryDate)) set.expiryDate = expiry;
    set.importantDates = (cls.importantDates || [])
      .map((d) => ({ label: d.label, date: parseDateOnly(d.date) }))
      .filter((d) => d.date);

    await Document.updateOne({ _id: docId }, { $set: set });

    // a later expiry date means the renewal task is done
    const updated = await Document.findById(docId, '-extractedText -versions');
    if (updated) await syncAfterDateChange(updated, null).catch((e) => console.error('[pipeline] renewal sync failed:', e.message));
  } catch (err) {
    console.error('[pipeline] failed for', String(docId), err.message);
    await setStage(docId, 'failed', {
      processingError: `${err.message} You can edit the details manually or retry processing.`,
    }).catch(() => {});
  }
}

/** Re-run OCR/classification on a stored document (downloads the file back from Cloudinary). */
async function reprocess(doc, opts = {}) {
  const url = cloudinary.signedUrl(doc.cloudinaryPublicId, doc.cloudinaryResourceType);
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 });
  return runPipeline(doc._id, Buffer.from(res.data), { mimetype: doc.mimeType, filename: doc.originalName, ...opts });
}

/** On server start, anything left mid-pipeline by a crash/restart is marked failed so the UI does not spin forever. */
async function recoverStuck() {
  const cutoff = new Date(Date.now() - 10 * 60 * 1000);
  await Document.updateMany(
    { processingStatus: { $in: ['processing', 'extracting', 'classifying'] }, updatedAt: { $lt: cutoff } },
    { $set: { processingStatus: 'failed', processingError: 'Processing was interrupted. Please retry.' } }
  );
}

module.exports = { runPipeline, reprocess, recoverStuck };
