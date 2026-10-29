
import { Platform } from 'react-native';

const fallback =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5000'
    : 'http://localhost:5000';

export const BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || fallback
).replace(/\/+$/, '');

export const API_URL = `${BASE_URL}/api`;

export const POLL_INTERVAL_MS = 1500;
export const POLL_TIMEOUT_MS = 3 * 60 * 1000;
export const UPLOAD_TIMEOUT_MS = 90 * 1000;
