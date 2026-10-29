const User = require('../models/User');
const Document = require('../models/Document');
const Notification = require('../models/Notification');
const { config } = require('../config/env');
const { daysRemaining, todayInZone, DAY_MS } = require('../utils/expiry');
const { dueReminder, dedupeKey, buildMessage } = require('../utils/reminders');
const { recommendedAction } = require('../utils/renewalGuide');
const { ensureRenewal } = require('./renewalService');
const { sendExpiryAlert } = require('./mailService');
const { sendPush } = require('./pushService');

async function deliver(user, n, doc, { heading, body, action }) {
  const prefs = user.preferences || {};
  const set = {};

  // Retry email only when it has not already been marked as sent.
  if (prefs.emailNotifications !== false && !n.channels?.emailSentAt) {
    try {
      if (await sendExpiryAlert(user, { heading, body, action })) {
        set['channels.emailSentAt'] = new Date();
      }
    } catch (err) {
      console.error('[notify] email failed:', err.message);
    }
  }

  // Do not resend a push notification already marked as sent.
  if (
    prefs.pushNotifications !== false &&
    user.pushToken &&
    !n.channels?.pushSentAt
  ) {
    try {
      if (await sendPush(user, {
        title: heading,
        body,
        data: { documentId: String(doc._id), type: 'expiry' },
      })) {
        set['channels.pushSentAt'] = new Date();
      }
    } catch (err) {
      console.error('[notify] push failed:', err.message);
    }
  }

  if (Object.keys(set).length) {
    await Notification.updateOne({ _id: n._id }, { $set: set });
  }
}

/** Create due reminders and retry undelivered channels on existing reminders. */
async function scanUser(user, { now = new Date() } = {}) {
  const prefs = user.preferences || {};
  const schedule = (
    prefs.reminderDays?.length
      ? prefs.reminderDays
      : config.notificationScheduleDays
  ).filter((n) => n > 0).sort((a, b) => b - a);

  if (!schedule.length) return 0;

  const today = todayInZone(config.timezone, now);
  const windowEnd = new Date(today + schedule[0] * DAY_MS);
  const oldest = new Date(today - config.expiredNotifyGraceDays * DAY_MS);

  const docs = await Document.find(
    { userId: user._id, expiryDate: { $gte: oldest, $lte: windowEnd } },
    '-extractedText -versions'
  );

  let created = 0;

  for (const doc of docs) {
    const days = daysRemaining(doc.expiryDate, { tz: config.timezone, now });
    const due = dueReminder(days, schedule);
    if (!due) continue;

    const msg = buildMessage(doc.title, days, due.kind);
    const action = recommendedAction(doc.documentType);
    const key = dedupeKey(user._id, doc._id, doc.expiryDate, due.threshold);

    let n;
    let isNew = false;

    try {
      n = await Notification.create({
        userId: user._id,
        documentId: doc._id,
        type: 'expiry',
        title: msg.heading,
        message: msg.body,
        daysRemaining: days,
        thresholdDays: due.threshold,
        recommendedAction: action,
        channels: { inApp: prefs.inAppNotifications !== false },
        dedupeKey: key,
      });
      isNew = true;
      created += 1;
    } catch (err) {
      if (err.code !== 11000) throw err;

      // Reminder already exists: reuse it and retry only missing delivery channels.
      n = await Notification.findOne({ dedupeKey: key });
      if (!n) continue;
    }

    await ensureRenewal(doc, user).catch((e) => {
      console.error('[notify] renewal create failed:', e.message);
    });

    await deliver(user, n, doc, { ...msg, action });

    if (!isNew) {
      console.log(
        '[notify] checked existing reminder',
        String(n._id),
        'emailSentAt:',
        n.channels?.emailSentAt ? 'present' : 'missing'
      );
    }
  }

  return created;
}

let running = false;

/** Scan every user or one user. Overlapping runs are skipped. */
async function scanAll({ userId } = {}) {
  if (running) return { skipped: true, created: 0 };

  running = true;
  let created = 0;

  try {
    const filter = userId ? { _id: userId } : {};
    const cursor = User.find(filter).cursor();

    for await (const user of cursor) {
      try {
        created += await scanUser(user);
      } catch (err) {
        console.error(
          '[notify] scan failed for user',
          String(user._id),
          err.message
        );
      }
    }

    return { skipped: false, created };
  } finally {
    running = false;
  }
}

module.exports = { scanUser, scanAll };
