import api, { getAuthToken, setUnauthorizedHandler } from './api';
import { API_URL } from '../constants/config';
import * as FileSystem from 'expo-file-system/legacy';
import { File } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';

export const documentService = {
  list: (params) =>
    api.get('/documents', { params }).then((r) => r.data),

  get: (id) =>
    api.get(`/documents/${id}`).then((r) => r.data.document),

  update: (id, body) =>
    api.put(`/documents/${id}`, body).then((r) => r.data.document),

  remove: (id) =>
    api.delete(`/documents/${id}`).then((r) => r.data),

  search: (q) =>
    api.get('/documents/search', { params: { q } }).then((r) => r.data),

  stats: () =>
    api.get('/documents/stats').then((r) => r.data),

  expiring: () =>
    api.get('/documents/expiring').then((r) => r.data),

  expired: () =>
    api.get('/documents/expired').then((r) => r.data),

  // version history
  versions: (id) =>
    api.get(`/documents/${id}/versions`).then((r) => r.data),

  restoreVersion: (id, versionNumber) =>
    api.post(`/documents/${id}/versions/${versionNumber}/restore`).then((r) => r.data.document),

  // secure sharing
  createShare: (id, expiresInHours) =>
    api.post(`/documents/${id}/share`, { expiresInHours }).then((r) => r.data),

  shares: (id) =>
    api.get(`/documents/${id}/shares`).then((r) => r.data.shares),

  revokeShare: (id, linkId) =>
    api.delete(`/documents/${id}/shares/${linkId}`).then((r) => r.data),

  reprocess: (documentId) =>
    api.post('/ocr/process', { documentId }).then((r) => r.data.document),
};

/** Server response ko handle karke document return karta hai. */
function handleResponse(status, rawBody) {
  let data = null;
  try {
    data = rawBody ? JSON.parse(rawBody) : null;
  } catch (_e) {
    // non-JSON response
  }

  if (status < 200 || status >= 300) {
    console.log('[upload] status:', status, 'body:', rawBody?.slice(0, 500));

    let message = data?.message || data?.error;
    if (!message) {
      if (status === 413) message = 'File is too large.';
      else if (status === 401) message = 'Session expired. Please login again.';
      else message = `Upload failed (${status})`;
    }

    const error = new Error(message);
    error.response = { status, data: data || {} };
    throw error;
  }

  if (!data?.document) {
    throw new Error('Upload succeeded but no document was returned.');
  }

  return data.document;
}

/** Tareeka 1: expo-file-system uploadAsync */
async function uploadWithUploadAsync(url, uri, mimeType, parameters, token) {
  const result = await FileSystem.uploadAsync(url, uri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    mimeType,
    parameters,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  return handleResponse(result.status, result.body);
}

/** Tareeka 2: Expo File + expo/fetch */
async function uploadWithExpoFetch(url, uri, parameters, token) {
  const expoFile = new File(uri);
  const formData = new FormData();
  formData.append('file', expoFile);
  Object.entries(parameters).forEach(([k, v]) => formData.append(k, v));

  const response = await expoFetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: formData,
  });
  const raw = await response.text();
  return handleResponse(response.status, raw);
}

/**
 * file = { uri, name?, type? }  (DocumentPicker asset bhi chalega)
 */
async function postFile(pathname, file, fields = {}) {
  console.log('[upload] v4 start', `${API_URL}${pathname}`, file?.uri);

  if (!file?.uri) {
    throw new Error('No file selected.');
  }

  const token = getAuthToken();
  if (!token) {
    throw new Error('You are not logged in. Please login again.');
  }

  const url = `${API_URL}${pathname}`;
  const mimeType = file.type || file.mimeType || 'application/pdf';

  // Extra form fields (title, category, ...)
  const parameters = {};
  Object.entries(fields).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      parameters[k] = String(v).trim();
    }
  });

  // 1) File ki info dekho
  try {
    const info = await FileSystem.getInfoAsync(file.uri);
    console.log('[upload] file info:', JSON.stringify(info));
  } catch (e) {
    console.log('[upload] getInfo failed:', e?.message);
  }

  // 2) File ko nayi jagah copy karo (fail ho to original URI use hoga)
  let uploadUri = file.uri;
  try {
    const safeName = (file.name || 'document.pdf').replace(/[^\w.\-]+/g, '_');
    const dest = `${FileSystem.cacheDirectory}${safeName}`;
    await FileSystem.copyAsync({ from: file.uri, to: dest });
    uploadUri = dest;
    console.log('[upload] copied to:', dest);
  } catch (e) {
    console.log('[upload] copy failed:', e?.message);
  }

  // 3) Upload, 90 sec timeout ke saath
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error('Upload timed out. Please check your connection and try again.');
      err.code = 'UPLOAD_TIMEOUT';
      reject(err);
    }, 90 * 1000);
  });

  const doUpload = async () => {
    try {
      return await uploadWithUploadAsync(url, uploadUri, mimeType, parameters, token);
    } catch (e) {
      // Server ka jawab aaya (status mila) to dobara try mat karo
      if (e?.response?.status) throw e;

      console.log('[upload] uploadAsync failed, trying expo/fetch:', e?.message);
      return await uploadWithExpoFetch(url, uploadUri, parameters, token);
    }
  };

  try {
    return await Promise.race([doUpload(), timeoutPromise]);
  } catch (error) {
    console.log('[upload] error:', error?.message);
    throw error;
  } finally {
    clearTimeout(timer);
    // Temp copy delete karo
    if (uploadUri !== file.uri) {
      FileSystem.deleteAsync(uploadUri, { idempotent: true }).catch(() => {});
    }
  }
}

export const uploadDocument = (file, { title, category } = {}) =>
  postFile('/documents/upload', file, { title, category });

/** Upload a replacement file as a new version of an existing document. */
export const uploadVersion = (documentId, file) =>
  postFile(`/documents/${documentId}/versions`, file);

export { setUnauthorizedHandler };