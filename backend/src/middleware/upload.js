const multer = require('multer');
const { config } = require('../config/env');
const ApiError = require('../utils/ApiError');

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(new ApiError(415, 'Unsupported file type. Please upload a JPG, PNG, WEBP image or a PDF.', 'UNSUPPORTED_FILE'));
    }
    return cb(null, true);
  },
}).single('file');

/** Check the real file signature so a renamed .exe cannot pass as an image. */
function detectMime(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'image/webp';
  if (buf.slice(0, 4).toString() === '%PDF') return 'application/pdf';
  return null;
}

function requireValidFile(req, _res, next) {
  if (!req.file) return next(new ApiError(400, 'No file received. Attach the document in the "file" field.', 'NO_FILE'));
  const real = detectMime(req.file.buffer);
  if (!real) return next(new ApiError(415, 'This file does not look like a valid image or PDF.', 'INVALID_FILE'));
  req.file.mimetype = real;
  return next();
}

module.exports = { upload, requireValidFile, detectMime };
