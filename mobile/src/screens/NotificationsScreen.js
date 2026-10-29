import React, { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import { EmptyState, ErrorState, LoadingView } from '../components/States';
import { colors } from '../constants/theme';
import { notificationService } from '../services/notificationService';
import { formatDateTime } from '../utils/date';
import { getErrorMessage } from '../utils/errors';

export default function NotificationsScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [checking, setChecking] = useState(false);
  const reqId = useRef(0);

  const load = useCallback(async (isRefresh = false) => {
    const id = ++reqId.current;
    if (isRefresh) setRefreshing(true);
    try {
      const res = await notificationService.list({ limit: 50 });
      if (id === reqId.current) { setData(res); setError(null); }
    } catch (err) {
      if (id === reqId.current) setError(getErrorMessage(err));
    } finally {
      if (id === reqId.current) setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const open = async (n) => {
    if (!n.read) {
      setData((d) => ({ ...d, unreadCount: Math.max(0, d.unreadCount - 1), notifications: d.notifications.map((x) => (x.id === n.id ? { ...x, read: true } : x)) }));
      notificationService.markRead(n.id).catch(() => {});
    }
    if (n.documentId) navigation.navigate('RenewalDetail', { documentId: n.documentId });
  };

  const markAll = async () => {
    try { await notificationService.markAllRead(); load(); } catch (err) { Alert.alert('Could not update', getErrorMessage(err)); }
  };

  const remove = (n) => {
    setData((d) => ({ ...d, notifications: d.notifications.filter((x) => x.id !== n.id), unreadCount: n.read ? d.unreadCount : Math.max(0, d.unreadCount - 1) }));
    notificationService.remove(n.id).catch(() => load());
  };

  const checkNow = async () => {
    setChecking(true);
    try {
      const r = await notificationService.scanNow();
      await load();
      Alert.alert('Check complete', r.created ? `${r.created} new reminder${r.created === 1 ? '' : 's'} created.` : 'No new reminders are due right now.');
    } catch (err) {
      Alert.alert('Could not check', getErrorMessage(err));
    } finally { setChecking(false); }
  };

  const body = () => {
    if (!data && !error) return <LoadingView label="Loading notifications…" />;
    if (!data) return <ErrorState message={error} onRetry={() => load()} />;
    return (
      <>
        <View style={styles.actions}>
          <Button title="Mark all read" small variant="secondary" onPress={markAll} disabled={!data.unreadCount} style={{ flex: 1, marginRight: 8 }} />
          <Button title="Check now" small variant="outline" icon="refresh" onPress={checkNow} loading={checking} style={{ flex: 1 }} />
        </View>
        {!data.notifications.length ? (
          <EmptyState icon="notifications-off-outline" title="You’re all caught up" message="Reminders appear here 90, 30, 7 and 1 day before a document expires, and again once it has expired." />
        ) : data.notifications.map((n) => (
          <Pressable key={n.id} onPress={() => open(n)} style={{ marginBottom: 10 }}>
            <Card style={[styles.card, !n.read && styles.unread]}>
              <View style={[styles.dot, { backgroundColor: n.daysRemaining !== null && n.daysRemaining < 0 ? '#FEE2E2' : '#FEF3C7' }]}>
                <Ionicons name={n.daysRemaining !== null && n.daysRemaining < 0 ? 'alert-circle' : 'time'} size={20} color={n.daysRemaining !== null && n.daysRemaining < 0 ? colors.danger : '#B45309'} />
              </View>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={[styles.title, !n.read && { fontWeight: '800' }]}>{n.title}</Text>
                <Text style={styles.msg}>{n.message}</Text>
                {n.recommendedAction ? <Text style={styles.rec}>Next step: {n.recommendedAction}</Text> : null}
                <Text style={styles.meta}>{formatDateTime(n.createdAt)}{n.channels.email ? ' · emailed' : ''}{n.channels.push ? ' · pushed' : ''}</Text>
              </View>
              <Pressable onPress={() => remove(n)} hitSlop={10}><Ionicons name="close" size={18} color={colors.muted} /></Pressable>
            </Card>
          </Pressable>
        ))}
      </>
    );
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}>
      {body()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', marginBottom: 14 },
  card: { flexDirection: 'row', alignItems: 'flex-start', padding: 14 },
  unread: { borderColor: colors.primary, backgroundColor: '#FAFAFF' },
  dot: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '600', color: colors.text },
  msg: { fontSize: 13, color: colors.textSecondary, marginTop: 3, lineHeight: 18 },
  rec: { fontSize: 12, color: colors.primary, marginTop: 6, fontWeight: '600' },
  meta: { fontSize: 11, color: colors.muted, marginTop: 6 },
});
