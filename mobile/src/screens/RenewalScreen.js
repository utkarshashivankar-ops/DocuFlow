import React, { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import RenewalBadge from '../components/RenewalBadge';
import NotificationBell from '../components/NotificationBell';
import { EmptyState, ErrorState, LoadingView } from '../components/States';
import { categoryMeta } from '../constants/categories';
import { colors, radius } from '../constants/theme';
import { renewalService } from '../services/renewalService';
import { daysText } from '../utils/date';
import { getErrorMessage } from '../utils/errors';

function RenewalCard({ item, onPress }) {
  const meta = categoryMeta(item.document.category);
  const { done, total } = item.progress;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const expired = item.document.status === 'Expired';
  return (
    <Pressable onPress={onPress} style={{ marginBottom: 10 }}>
      <Card>
        <View style={styles.top}>
          <View style={[styles.icon, { backgroundColor: meta.bg }]}><Ionicons name={meta.icon} size={20} color={meta.color} /></View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.title} numberOfLines={1}>{item.document.title}</Text>
            <Text style={[styles.days, expired && { color: colors.danger }]}>{daysText(item.document.daysRemaining) || 'No expiry date'}</Text>
          </View>
          <RenewalBadge status={item.status} />
        </View>
        <Text style={styles.action}>{item.recommendedAction}</Text>
        <View style={styles.barRow}>
          <View style={styles.track}><View style={[styles.fill, { width: `${pct}%` }]} /></View>
          <Text style={styles.count}>{done}/{total}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

export default function RenewalScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const reqId = useRef(0);

  const load = useCallback(async (isRefresh = false) => {
    const id = ++reqId.current;
    if (isRefresh) setRefreshing(true);
    try {
      const res = await renewalService.overview();
      if (id === reqId.current) { setData(res); setError(null); }
    } catch (err) {
      if (id === reqId.current) setError(getErrorMessage(err));
    } finally {
      if (id === reqId.current) setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const open = (item) => navigation.navigate('RenewalDetail', { documentId: item.documentId });

  const body = () => {
    if (!data && !error) return <LoadingView label="Preparing your renewal tasks…" />;
    if (!data) return <ErrorState message={error} onRetry={() => load()} />;
    if (!data.items.length) {
      return <EmptyState icon="shield-checkmark-outline" title="Nothing needs renewal" message="When a document is expired or about to expire, a renewal checklist with step-by-step guidance appears here automatically." />;
    }
    const { summary, items } = data;
    const todo = items.filter((i) => i.status !== 'Completed');
    const done = items.filter((i) => i.status === 'Completed');
    return (
      <>
        <Card style={styles.summary}>
          <View style={styles.sumCol}><Text style={[styles.sumNum, { color: colors.danger }]}>{summary.notStarted}</Text><Text style={styles.sumLabel}>Not started</Text></View>
          <View style={styles.sumCol}><Text style={[styles.sumNum, { color: '#B45309' }]}>{summary.inProgress}</Text><Text style={styles.sumLabel}>In progress</Text></View>
          <View style={styles.sumCol}><Text style={[styles.sumNum, { color: colors.success }]}>{summary.completed}</Text><Text style={styles.sumLabel}>Completed</Text></View>
        </Card>

        {todo.length ? <Text style={styles.section}>To do</Text> : null}
        {todo.map((i) => <RenewalCard key={i.id} item={i} onPress={() => open(i)} />)}

        {done.length ? <Text style={styles.section}>Completed</Text> : null}
        {done.map((i) => <RenewalCard key={i.id} item={i} onPress={() => open(i)} />)}
      </>
    );
  };

  return (
    <Screen
      title="Renewal"
      subtitle="Turn expiry dates into action"
      right={<NotificationBell />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
    >
      {body()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', marginBottom: 4 },
  sumCol: { flex: 1, alignItems: 'center' },
  sumNum: { fontSize: 28, fontWeight: '800' },
  sumLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 14, marginBottom: 10 },
  top: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  days: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  action: { fontSize: 13, color: colors.text, marginTop: 12, fontWeight: '600' },
  barRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#E5E7EB', overflow: 'hidden' },
  fill: { height: 6, backgroundColor: colors.primary },
  count: { fontSize: 12, color: colors.textSecondary, marginLeft: 8, fontWeight: '600' },
});
