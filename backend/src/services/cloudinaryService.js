const cloudinary = require('cloudinary').v2;
const { config } = require('../config/env');
const ApiError = require('../utils/ApiError');

if (config.cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
}

function ensureConfigured() {
  if (!config.cloudinaryConfigured) {
    throw new ApiError(503, 'File storage is not configured on the server yet.', 'STORAGE_NOT_CONFIGURED');
  }
}

/** Upload a buffer as a private ("authenticated") asset under docuflow/<userId>/. */
function uploadBuffer(buffer, { userId }) {
  ensureConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `docuflow/${userId}`, resource_type: 'auto', type: 'authenticated' },
      (err, result) => (err ? reject(new ApiError(502, 'Could not store the file. Please try again.', 'STORAGE_FAILED')) : resolve(result))
    );
    stream.end(buffer);
  });
}

async function destroy(publicId, resourceType = 'image') {
  if (!config.cloudinaryConfigured || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, type: 'authenticated', invalidate: true });
  } catch (err) {
    console.error('[cloudinary] destroy failed', publicId, err.message);
  }
}

/** Signed URL - only the backend (holding the API secret) can mint these; clients get them only for their own documents. */
function signedUrl(publicId, resourceType = 'image', extra = {}) {
  if (!config.cloudinaryConfigured || !publicId) return null;
  return cloudinary.url(publicId, { type: 'authenticated', resource_type: resourceType, sign_url: true, secure: true, ...extra });
}

function thumbnailUrl(publicId, resourceType = 'image') {
  if (resourceType !== 'image') return null;
  return signedUrl(publicId, 'image', { transformation: [{ width: 480, height: 480, crop: 'limit' }], format: 'jpg' });
}

module.exports = { uploadBuffer, destroy, signedUrl, thumbnailUrl };
