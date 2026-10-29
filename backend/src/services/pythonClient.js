const axios = require('axios');
const FormData = require('form-data');
const { config } = require('../config/env');

const http = axios.create({ baseURL: config.python.url, timeout: 120000, maxBodyLength: Infinity });
const authHeaders = () => (config.python.key ? { 'X-Service-Key': config.python.key } : {});

class ProcessingError extends Error {}

function wrap(err, fallback) {
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ECONNABORTED') {
    return new ProcessingError('The document processing service is not reachable.');
  }
  const msg = err.response?.data?.error;
  return new ProcessingError(msg || fallback);
}

/** Tesseract OCR (runs inside the Python service). */
async function runOcr(buffer, { mimetype, filename }) {
  const form = new FormData();
  form.append('file', buffer, { filename: filename || 'upload', contentType: mimetype });
  try {
    const { data } = await http.post('/ocr', form, { headers: { ...form.getHeaders(), ...authHeaders() } });
    return data; // { text, confidence, pages }
  } catch (err) {
    throw wrap(err, 'Text extraction failed.');
  }
}

/** Rule-based classification + field extraction. */
async function classifyText(text) {
  try {
    const { data } = await http.post('/classify', { text }, { headers: authHeaders() });
    return data;
  } catch (err) {
    throw wrap(err, 'Classification failed.');
  }
}

module.exports = { runOcr, classifyText, ProcessingError };
