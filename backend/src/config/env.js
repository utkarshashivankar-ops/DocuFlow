require('dotenv').config();

const num = (v, d) => (v !== undefined && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : d);

const config = {
  env: process.env.NODE_ENV || 'development',
  port: num(process.env.PORT, 5000),
  corsOrigins: (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
  timezone: process.env.APP_TIMEZONE || 'Asia/Kolkata',
  mongoUri: process.env.MONGO_URI,
  jwt: { secret: process.env.JWT_SECRET, expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  python: {
    url: (process.env.PYTHON_SERVICE_URL || 'http://localhost:8000').replace(/\/$/, ''),
    key: process.env.PYTHON_SERVICE_KEY || '',
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: num(process.env.SMTP_PORT, 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.MAIL_FROM || 'DocuFlow <no-reply@docuflow.local>',
  },
  publicUrl: (process.env.PUBLIC_URL || `http://localhost:${num(process.env.PORT, 5000)}`).replace(/\/$/, ''),
  trustProxy: process.env.TRUST_PROXY === 'true',
  forceHttps: process.env.FORCE_HTTPS === 'true',
  notificationScanMinutes: num(process.env.NOTIFICATION_SCAN_MINUTES, 60),
  expiredNotifyGraceDays: num(process.env.EXPIRED_NOTIFY_GRACE_DAYS, 30),
  maxUploadMb: num(process.env.MAX_UPLOAD_MB, 10),
  expiryWarningDays: num(process.env.EXPIRY_WARNING_DAYS, 30),
  notificationScheduleDays: (process.env.NOTIFICATION_SCHEDULE_DAYS || '90,30,7,1')
    .split(',').map(Number).filter((n) => n > 0).sort((a, b) => b - a),
};

config.cloudinaryConfigured = Boolean(
  config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret
);
config.smtpConfigured = Boolean(config.smtp.host);

function validateConfig() {
  const missing = [];
  if (!config.mongoUri) missing.push('MONGO_URI');
  if (!config.jwt.secret) missing.push('JWT_SECRET');
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}. Copy .env.example to .env and fill them in.`);
  }
  if (config.jwt.secret.length < 16) {
    throw new Error('JWT_SECRET must be at least 16 characters long.');
  }
  if (!config.cloudinaryConfigured) {
    console.warn('[config] Cloudinary is not configured - document uploads will return 503 until CLOUDINARY_* variables are set.');
  }
  if (!config.smtpConfigured) {
    console.warn('[config] SMTP is not configured - emails will not be sent (reset codes are printed to the console in development).');
  }
}

module.exports = { config, validateConfig };
