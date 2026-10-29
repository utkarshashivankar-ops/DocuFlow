const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { config } = require('./config/env');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
if (config.trustProxy) app.set('trust proxy', 1); // behind Render/Railway/Nginx: real client IP + https detection

// HTTPS everywhere in production: the TLS certificate lives on the host/proxy; this redirects any plain-http request.
if (config.forceHttps) {
  app.use((req, res, next) => (req.secure ? next() : res.redirect(308, `https://${req.headers.host}${req.originalUrl}`)));
}
app.use(helmet({ hsts: { maxAge: 15552000, includeSubDomains: true } })); // HSTS: browsers stick to https
app.use(
  cors({
    origin: config.corsOrigins.length ? config.corsOrigins : config.env !== 'production',
    credentials: false,
  })
);
app.use(express.json({ limit: '1mb' }));
if (config.env !== 'test') app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

app.use(
  '/api',
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please slow down.' } })
);

app.get('/api/health', (_req, res) =>
  res.json({ success: true, status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', time: new Date().toISOString() })
);

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/documents', require('./routes/document.routes'));
app.use('/api/ocr', require('./routes/ocr.routes'));
app.use('/api/renewals', require('./routes/renewal.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

const share = require('./routes/share.routes');
app.use('/api/shared', share.api);   // public, token-based
app.use('/s', share.pages);          // public landing page for a shared link

app.use(notFound);
app.use(errorHandler);

module.exports = app;
