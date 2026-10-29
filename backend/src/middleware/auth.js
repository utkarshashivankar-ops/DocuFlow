const jwt = require('jsonwebtoken');
const { config } = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Please sign in to continue.', 'NO_TOKEN');

  let payload;
  try {
    payload = jwt.verify(token, config.jwt.secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw new ApiError(401, 'Your session has expired. Please sign in again.', 'TOKEN_EXPIRED');
    throw new ApiError(401, 'Invalid session. Please sign in again.', 'TOKEN_INVALID');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, 'This account no longer exists.', 'USER_NOT_FOUND');
  req.user = user;
  next();
});

const requireRole = (...roles) => (req, _res, next) =>
  roles.includes(req.user.role) ? next() : next(new ApiError(403, 'You do not have permission to do that.', 'FORBIDDEN'));

module.exports = { protect, requireRole };
