const multer = require('multer');
const { config } = require('../config/env');

const notFound = (req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let status = err.status || 500;
  let message = err.message;
  let code = err.code;
  let details = err.details;

  if (err instanceof multer.MulterError) {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? `File is too large. Maximum size is ${config.maxUploadMb} MB.` : 'Upload failed. Please try again.';
    code = err.code;
  } else if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    message = Object.values(err.errors)[0]?.message || 'Invalid data.';
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier.';
  } else if (err.code === 11000) {
    status = 409;
    message = 'That value is already in use.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON in request body.';
  } else if (!err.isApiError) {
    status = 500;
  }

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err); // full detail stays on the server
    message = 'Something went wrong on our side. Please try again.';
    details = undefined;
  }

  res.status(status).json({ success: false, message, code, details });
};

module.exports = { notFound, errorHandler };
