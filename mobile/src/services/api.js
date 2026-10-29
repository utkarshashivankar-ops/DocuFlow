import axios from 'axios';
import { API_URL } from '../constants/config';

let authToken = null;
let onUnauthorized = null;

export const setAuthToken = (t) => { authToken = t; };
export const getAuthToken = () => authToken;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

const SESSION_CODES = ['TOKEN_EXPIRED', 'TOKEN_INVALID', 'USER_NOT_FOUND', 'NO_TOKEN'];

const api = axios.create({ baseURL: API_URL, timeout: 20000, headers: { Accept: 'application/json' } });

api.interceptors.request.use((cfg) => {
  if (authToken) cfg.headers.Authorization = `Bearer ${authToken}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err.response?.status;
    const code = err.response?.data?.code;
    if (status === 401 && authToken && SESSION_CODES.includes(code) && onUnauthorized) onUnauthorized(code);
    return Promise.reject(err);
  }
);

export default api;
