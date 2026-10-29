// Pure expiry logic. Status is NEVER stored - it is always derived from expiryDate "today".
const DAY_MS = 86400000;

/** Midnight (UTC-encoded) of "today" in the given IANA timezone, as epoch ms. */
function todayInZone(tz = 'Asia/Kolkata', now = new Date()) {
  const ymd = now.toLocaleDateString('en-CA', { timeZone: tz }); // YYYY-MM-DD
  return Date.parse(`${ymd}T00:00:00.000Z`);
}

function daysRemaining(expiryDate, { tz, now } = {}) {
  if (!expiryDate) return null;
  const e = new Date(expiryDate);
  if (Number.isNaN(e.getTime())) return null;
  const expDay = Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate());
  return Math.round((expDay - todayInZone(tz, now)) / DAY_MS);
}

/** 'Expired' | 'Expiring Soon' | 'Active'. Documents without an expiry date are 'Active'. */
function computeStatus(expiryDate, warningDays = 30, opts = {}) {
  const days = daysRemaining(expiryDate, opts);
  if (days === null) return 'Active';
  if (days < 0) return 'Expired';
  if (days <= warningDays) return 'Expiring Soon';
  return 'Active';
}

/** Mongo date ranges matching the status definitions above. */
function expiryRanges(warningDays = 30, { tz, now } = {}) {
  const today = todayInZone(tz, now);
  return {
    today: new Date(today),
    soonEnd: new Date(today + warningDays * DAY_MS),
  };
}

/** Parse 'YYYY-MM-DD' (or ISO) to a Date at UTC midnight. Returns null if invalid. */
function parseDateOnly(value) {
  if (value === null || value === undefined || value === '') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (!m) return undefined; // undefined => invalid
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) return undefined;
  return d;
}

module.exports = { todayInZone, daysRemaining, computeStatus, expiryRanges, parseDateOnly, DAY_MS };
