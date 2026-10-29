const { config } = require('../config/env');
const { scanAll } = require('./notificationEngine');

let timer = null;

/** Run the expiry scan shortly after start-up and then every NOTIFICATION_SCAN_MINUTES (default 60). */
function start() {
  if (config.env === 'test' || timer) return;
  const run = async () => {
    try {
      const r = await scanAll();
      if (r.created) console.log(`[scheduler] ${r.created} new reminder(s) created`);
    } catch (err) {
      console.error('[scheduler] scan failed:', err.message);
    }
  };
  setTimeout(run, 15 * 1000).unref();
  timer = setInterval(run, Math.max(1, config.notificationScanMinutes) * 60 * 1000);
  timer.unref();
  console.log(`[scheduler] expiry scan every ${config.notificationScanMinutes} min`);
}

function stop() { if (timer) clearInterval(timer); timer = null; }

module.exports = { start, stop };
