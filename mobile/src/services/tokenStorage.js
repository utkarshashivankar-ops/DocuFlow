import * as SecureStore from 'expo-secure-store';

const KEY = 'docuflow_token';
export const saveToken = (t) => SecureStore.setItemAsync(KEY, t);
export const loadToken = () => SecureStore.getItemAsync(KEY);
export const clearToken = () => SecureStore.deleteItemAsync(KEY);
