const axios = require('axios');
const User = require('../models/User');

const EXPO_URL = 'https://exp.host/--/api/v2/push/send';
const isExpoToken = (t) => typeof t === 'string' && /^Expo(nent)?PushToken\[.+\]$/.test(t);

/** Send one push notification through Expo's push service. Returns true when accepted. */
async function sendPush(user, { title, body, data }) {
  if (!isExpoToken(user.pushToken)) return false;
  const res = await axios.post(
    EXPO_URL,
    { to: user.pushToken, title, body, data, sound: 'default', priority: 'high' },
    { timeout: 15000, headers: { Accept: 'application/json', 'Content-Type': 'application/json' } }
  );
  const ticket = res.data?.data;
  if (ticket?.status === 'error') {
    if (ticket.details?.error === 'DeviceNotRegistered') {
      await User.updateOne({ _id: user._id }, { $set: { pushToken: null } }); // stale token - stop using it
    }
    throw new Error(ticket.message || 'Push rejected');
  }
  return true;
}

module.exports = { sendPush, isExpoToken };
