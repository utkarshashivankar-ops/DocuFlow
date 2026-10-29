// Pure reminder logic (no database) so it can be unit-tested.
const { daysRemaining } = require('./expiry');

/**
 * Decide which reminder (if any) is due for a document.
 *  - schedule e.g. [90, 30, 7, 1]
 *  - only the SMALLEST threshold that has been reached is returned, so a document uploaded with
 *    5 days left produces one "7 day" reminder instead of a burst of 90/30/7.
 *  - an expired document produces one 'expired' reminder (threshold 0).
 * Returns null when nothing is due.
 */
function dueReminder(days, schedule) {
  if (days === null || days === undefined) return null;
  if (days < 0) return { kind: 'expired', threshold: 0 };
  const reached = schedule.filter((t) => days <= t);
  if (!reached.length) return null;
  return { kind: 'upcoming', threshold: Math.min(...reached) };
}

/** One reminder per user + document + expiry date + threshold. A renewed expiry date starts a fresh cycle. */
function dedupeKey(userId, documentId, expiryDate, threshold) {
  const day = new Date(expiryDate).toISOString().slice(0, 10);
  return `${userId}:${documentId}:${day}:${threshold}`;
}

function buildMessage(title, days, kind) {
  if (kind === 'expired') {
    const ago = Math.abs(days);
    return {
      heading: `${title} has expired`,
      body: `${title} expired ${ago === 0 ? 'today' : `${ago} day${ago === 1 ? '' : 's'} ago`}. Start the renewal now.`,
    };
  }
  if (days === 0) return { heading: `${title} expires today`, body: `${title} expires today. Renew it as soon as possible.` };
  return {
    heading: `${title} expires in ${days} day${days === 1 ? '' : 's'}`,
    body: `${title} will expire in ${days} day${days === 1 ? '' : 's'}. Check the renewal checklist and get started.`,
  };
}

module.exports = { dueReminder, dedupeKey, buildMessage, daysRemaining };
