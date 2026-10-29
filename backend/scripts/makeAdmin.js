// Usage:  npm run make-admin -- someone@example.com        (promote)
//         npm run make-admin -- someone@example.com user   (demote)
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

(async () => {
  const [email, role = 'admin'] = process.argv.slice(2);
  if (!email || !['admin', 'user'].includes(role)) {
    console.error('Usage: npm run make-admin -- <email> [admin|user]');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const u = await User.findOneAndUpdate({ email: email.toLowerCase() }, { role }, { new: true });
  console.log(u ? `${u.email} is now "${u.role}".` : 'No user with that email.');
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
