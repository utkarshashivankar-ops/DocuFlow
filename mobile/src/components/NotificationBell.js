import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors } from '../constants/theme';
import { notificationService } from '../services/notificationService';

/** Bell with an unread badge; refreshes every time the screen it sits on gets focus. */
export default function NotificationBell() {
  const navigation = useNavigation();
  const [count, setCount] = useState(0);

  useFocusEffect(useCallback(() => {
    let alive = true;
    notificationService.unreadCount().then((n) => { if (alive) setCount(n); }).catch(() => {});
    return () => { alive = false; };
  }, []));

  return (
    <Pressable onPress={() => navigation.navigate('Notifications')} hitSlop={10} style={styles.wrap} accessibilityLabel="Notifications">
      <Ionicons name={count ? 'notifications' : 'notifications-outline'} size={26} color={colors.text} />
      {count > 0 ? (
        <View style={styles.badge}><Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text></View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 4 },
  badge: { position: 'absolute', top: 0, right: 0, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
