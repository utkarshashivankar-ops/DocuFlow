import React, { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import DocumentCard from '../components/DocumentCard';
import NotificationBell from '../components/NotificationBell';
import { ErrorState, LoadingView } from '../components/States';
import { CATEGORIES } from '../constants/categories';
import { colors, radius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { documentService } from '../services/documentService';
import { getErrorMessage } from '../utils/errors';

function StatCard({ label, value, icon, color, bg, onPress }) {
  return (
    <Pressable onPress={onPress} style={{ width: '48.5%', marginBottom: 10 }}>
      <Card style={{ padding: 14 }}>
        <View style={[styles.statIcon, { backgroundColor: bg }]}><Ionicons name={icon} size={18} color={color} /></View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </Card>
    </Pressable>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const reqId = useRef(0);

  const load = useCallback(async (isRefresh = false) => {
    const id = ++reqId.current;
    if (isRefresh) setRefreshing(true);
    try {
      const res = await documentService.stats();
      if (id === reqId.current) { setData(res); setError(null); }
    } catch (err) {
      if (id === reqId.current) setError(getErrorMessage(err));
    } finally {
      if (id === reqId.current) setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const goDocs = (params) => navigation.navigate('Documents', params);
  const first = (user?.name || '').split(' ')[0];

  const body = () => {
    if (!data && !error) return <LoadingView label="Loading your dashboard…" />;
    if (!data && error) return <ErrorState message={error} onRetry={() => load()} />;
    const { stats, recent } = data;
    return (
      <>
        <Pressable style={styles.search} onPress={() => navigation.navigate('Search')}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <Text style={styles.searchText}>Search by name, type, number or text…</Text>
        </Pressable>

        <View style={styles.grid}>
          <StatCard label="Total documents" value={stats.total} icon="documents-outline" color={colors.primary} bg={colors.primaryLight} onPress={() => goDocs({ filter: 'All' })} />
          <StatCard label="Expiring soon" value={stats.expiringSoon} icon="time-outline" color="#B45309" bg="#FEF3C7" onPress={() => goDocs({ filter: 'expiring' })} />
          <StatCard label="Expired" value={stats.expired} icon="alert-circle-outline" color={colors.danger} bg="#FEE2E2" onPress={() => goDocs({ filter: 'expired' })} />
          <StatCard label="Active" value={stats.active} icon="checkmark-circle-outline" color={colors.success} bg="#D1FAE5" onPress={() => goDocs({ filter: 'All' })} />
        </View>
        <Text style={styles.hint}>“Expiring soon” = within {stats.warningDays} days (change in Profile).</Text>

        <Text style={styles.section}>Categories</Text>
        <View style={styles.grid}>
          {CATEGORIES.map((c) => (
            <Pressable key={c.key} onPress={() => goDocs({ filter: c.key })} style={[styles.cat, { backgroundColor: c.bg }]}>
              <Ionicons name={c.icon} size={22} color={c.color} />
              <Text style={[styles.catName, { color: c.color }]}>{c.key}</Text>
              <Text style={styles.catCount}>{stats.categories[c.key] ?? 0}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.section}>Recently added</Text>
          {recent.length ? <Pressable onPress={() => goDocs({ filter: 'All' })}><Text style={styles.link}>See all</Text></Pressable> : null}
        </View>
        {recent.length ? (
          recent.map((d) => <DocumentCard key={d.id} doc={d} onPress={() => navigation.navigate('DocumentDetail', { id: d.id })} />)
        ) : (
          <Card style={{ alignItems: 'center' }}>
            <Text style={styles.emptyTitle}>No documents yet</Text>
            <Text style={styles.emptySub}>Scan or upload your first document to get started.</Text>
          </Card>
        )}
        <Button title="Quick upload" icon="cloud-upload-outline" onPress={() => navigation.navigate('AddDocument')} style={{ marginTop: 16 }} />
      </>
    );
  };

  return (
    <Screen
      title={first ? `Hi, ${first}` : 'Home'}
      subtitle="Your documents at a glance"
      right={<NotificationBell />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
    >
      {body()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, minHeight: 48, marginBottom: 16 },
  searchText: { color: colors.muted, marginLeft: 8, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: 10 },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  hint: { fontSize: 11, color: colors.muted, marginBottom: 8 },
  section: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 14, marginBottom: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { color: colors.primary, fontWeight: '600' },
  cat: { width: '31.5%', borderRadius: radius.md, padding: 12, marginBottom: 8, alignItems: 'flex-start' },
  catName: { fontSize: 12, fontWeight: '700', marginTop: 8 },
  catCount: { fontSize: 18, fontWeight: '800', color: colors.text },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 13, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
});
