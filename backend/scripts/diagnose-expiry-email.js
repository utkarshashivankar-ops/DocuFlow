const mongoose = require('mongoose');
const { config } = require('../src/config/env');
const Notification = require('../src/models/Notification');

(async () => {
  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log('MongoDB connected');

    const recent = await Notification.find({ type: 'expiry' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title documentId daysRemaining thresholdDays channels dedupeKey createdAt')
      .lean();

    console.log('Recent expiry notifications:');
    for (const n of recent) {
      console.log(JSON.stringify({
        id: String(n._id),
        title: n.title,
        documentId: n.documentId ? String(n.documentId) : null,
        daysRemaining: n.daysRemaining,
        thresholdDays: n.thresholdDays,
        emailSentAt: n.channels?.emailSentAt || null,
        createdAt: n.createdAt,
        dedupeKeyPresent: Boolean(n.dedupeKey),
      }));
    }
  } catch (err) {
    console.error('Diagnostic failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
})();
