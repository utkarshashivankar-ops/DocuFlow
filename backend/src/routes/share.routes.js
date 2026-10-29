const express = require('express');
const rateLimit = require('express-rate-limit');
const c = require('../controllers/shareController');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

// JSON + file stream:  /api/shared/:token  and  /api/shared/:token/file
const api = express.Router();
api.use(limiter);
api.get('/:token', c.meta);
api.get('/:token/file', c.file);

// human landing page:  /s/:token
const pages = express.Router();
pages.use(limiter);
pages.get('/:token', c.landing);

module.exports = { api, pages };
