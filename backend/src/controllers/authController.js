const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { config } = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendResetCode } = require('../services/mailService');

const DUMMY_HASH = bcrypt.hashSync('docuflow-dummy-password', 12); // equalises timing for unknown emails
const MAX_RESET_ATTEMPTS = 5;

const signToken = (user) => jwt.sign({ sub: String(user._id), role: user.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
const hashCode = (email, code) => crypto.createHmac('sha256', config.jwt.secret).update(`${email}:${code}`).digest('hex');

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists.', 'EMAIL_TAKEN');

  const user = await User.create({
    name,
    email,
    passwordHash: await User.hashPassword(password),
    preferences: { expiryWarningDays: config.expiryWarningDays, reminderDays: config.notificationScheduleDays },
  });
  res.status(201).json({ success: true, token: signToken(user), user });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = user ? await user.verifyPassword(password) : (await bcrypt.compare(password, DUMMY_HASH), false);
  if (!ok) throw new ApiError(401, 'Incorrect email or password.', 'INVALID_CREDENTIALS');

  user.lastLoginAt = new Date();
  await user.save();
  res.json({ success: true, token: signToken(user), user });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    const code = String(crypto.randomInt(100000, 1000000));
    user.resetCodeHash = hashCode(email, code);
    user.resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
    user.resetCodeAttempts = 0;
    await user.save();
    try {
      await sendResetCode(user.email, user.name, code);
    } catch (err) {
      console.error('[auth] could not send reset email:', err.message);
    }
  }
  // Same response whether or not the account exists (prevents account enumeration)
  res.json({ success: true, message: 'If an account exists for that email, a 6-digit reset code has been sent.' });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, code, password } = req.body;
  const bad = new ApiError(400, 'That code is invalid or has expired. Request a new one.', 'INVALID_RESET_CODE');

  const user = await User.findOne({ email }).select('+resetCodeHash +resetCodeExpires +resetCodeAttempts');
  if (!user || !user.resetCodeHash || !user.resetCodeExpires || user.resetCodeExpires < new Date()) throw bad;
  if (user.resetCodeAttempts >= MAX_RESET_ATTEMPTS) throw new ApiError(429, 'Too many attempts. Request a new code.', 'TOO_MANY_ATTEMPTS');

  const a = Buffer.from(hashCode(email, code));
  const b = Buffer.from(user.resetCodeHash);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    user.resetCodeAttempts += 1;
    await user.save();
    throw bad;
  }

  user.passwordHash = await User.hashPassword(password);
  user.resetCodeHash = undefined;
  user.resetCodeExpires = undefined;
  user.resetCodeAttempts = 0;
  await user.save();
  res.json({ success: true, message: 'Password updated. You can now sign in.' });
});
