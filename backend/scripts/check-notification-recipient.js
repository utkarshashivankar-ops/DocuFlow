const mongoose = require('mongoose');
const { config } = require('../src/config/env');
const Notification = require('../src/models/Notification');
const User = require('../src/models/User');

(async () => {
  try {
    await mongoose.connect(config.mongoUri);

    const n = await Notification.findById('6ae23b7a3516ff14e82dd361').lean();
    if (!n) throw new Error('Test notification not found');

    const u = await User.findById(n.userId).select('email preferences').lean();
    if (!u) throw new Error('Notification user not found');

    console.log({
      notificationFound: true,
      userEmailConfigured: Boolean(u.email),
      smtpRecipientMatchesUser: Boolean(
        u.email && process.env.SMTP_USER &&
        u.email.toLowerCase() === process.env.SMTP_USER.toLowerCase()
      ),
      emailNotificationsEnabled: u.preferences?.emailNotifications !== false,
      emailSentAt: n.channels?.emailSentAt || null,
      reminderThresholdDays: n.thresholdDays,
      daysRemaining: n.daysRemaining
    });
  } catch (e) {
    console.error('Diagnostic failed:', e.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
})();
