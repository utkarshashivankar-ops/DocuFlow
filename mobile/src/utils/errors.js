/** Turn any axios/fetch/Error into a short, user-friendly message. Never exposes stack traces. */
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;
  if (err.userMessage) return err.userMessage;
  if (err.response) {
    const { status, data } = err.response;
    if (data?.message) return data.message;
    if (status === 413) return 'That file is too large.';
    if (status === 429) return 'Too many requests. Please wait a moment.';
    if (status >= 500) return 'The server had a problem. Please try again shortly.';
    return fallback;
  }
  if (err.code === 'ECONNABORTED' || err.name === 'AbortError') return 'The server took too long to respond. Please try again.';
  if (err.request || err.message === 'Network Error' || err.message === 'Network request failed') {
    return 'Cannot reach the server. Check your internet connection and the API address in mobile/.env.';
  }
  return fallback;
}

export const fieldErrors = (err) => err?.response?.data?.details || {};
