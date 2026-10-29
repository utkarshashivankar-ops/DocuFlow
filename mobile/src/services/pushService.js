import { Platform } from 'react-native';
import { authService } from './authService';

/**
 * Registers this phone for push notifications and gives the token to the API.
 * expo-notifications / expo-device are optional at runtime: if they are not installed (or the app runs in Expo Go,
 * where Android remote push is unavailable) this quietly does nothing and in-app + email alerts still work.
 * Install once with:   npx expo install expo-notifications expo-device
 */
let Notifications = null;
let Device = null;
try { Notifications = require('expo-notifications'); } catch (_e) { /* optional */ }
try { Device = require('expo-device'); } catch (_e) { /* optional */ }

if (Notifications?.setNotificationHandler) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

export async function registerForPush() {
  try {
    if (!Notifications || !Device?.isDevice) return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('expiry', { name: 'Expiry alerts', importance: Notifications.AndroidImportance.HIGH });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') return null;

    const { data: token } = await Notifications.getExpoPushTokenAsync();
    if (token) await authService.updateProfile({ pushToken: token });
    return token;
  } catch (err) {
    console.log('[push] not registered:', err?.message);
    return null;
  }
}

/** Calls handler(documentId) when the user taps a notification; returns an unsubscribe function. */
export function onNotificationTap(handler) {
  if (!Notifications?.addNotificationResponseReceivedListener) return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
    const id = resp?.notification?.request?.content?.data?.documentId;
    if (id) handler(id);
  });
  return () => sub.remove();
}
