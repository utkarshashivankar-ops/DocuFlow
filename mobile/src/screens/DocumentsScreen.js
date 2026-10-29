import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import Chip from '../components/Chip';
import DocumentCard from '../components/DocumentCard';
import { EmptyState, ErrorState, LoadingView } from '../components/States';
import { FILTERS } from '../constants/categories';
import { colors, radius } from '../constants/theme';
import { documentService } from '../services/documentService';
import { getErrorMessage } from '../utils/errors';

const SORTS = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'expiry', label: 'Expiry date' },
];
const filterKey = (f) => f.status || f.category;

export default function DocumentsScreen({ navigation, route }) {
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('newest');
  const [docs, setDocs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const reqId = useRef(0);
  const filterRef = useRef('All');
  const sortRef = useRef('newest');
  const firstLoad = useRef(true);

  const fetchPage = useCallback(async (pageNum, f, s, mode) => {
    const id = ++reqId.current;
    if (mode === 'initial') setLoading(true);
    if (mode === 'more') setLoadingMore(true);
    if (mode === 'refresh') setRefreshing(true);
    try {
      const def = FILTERS.find((x) => filterKey(x) === f) || FILTERS[0];
      const params = { sort: s, page: pageNum, limit: 20 };
      if (def.status) params.status = def.status;
      else params.category = def.category;
      const res = await documentService.list(params);
      if (id !== reqId.current) return; // a newer request superseded this one
      setDocs((prev) => (pageNum === 1 ? res.documents : [...prev, ...res.documents]));
      setPage(pageNum);
      setHasMore(res.pagination.hasMore);
      setError(null);
    } catch (err) {
      if (id === reqId.current) setError(getErrorMessage(err));
    } finally {
      if (id === reqId.current) { setLoading(false); setLoadingMore(false); setRefreshing(false); }
    }
  }, []);

  // when the tab is focused: apply a filter coming from Home, then reload (so new uploads appear)
  useFocusEffect(
    useCallback(() => {
      const incoming = route.params?.filter;
      if (incoming) {
        filterRef.current = incoming;
        setFilter(incoming);
        navigation.setParams({ filter: undefined });
        fetchPage(1, incoming, sortRef.current, 'initial');
      } else {
        fetchPage(1, filterRef.current, sortRef.current, firstLoad.current ? 'initial' : 'refresh');
      }
      firstLoad.current = false;
    }, [route.params?.filter, fetchPage, navigation])
  );

  const pickFilter = (f) => { filterRef.current = f; setFilter(f); fetchPage(1, f, sortRef.current, 'initial'); };
  const pickSort = (s) => { sortRef.current = s; setSort(s); fetchPage(1, filterRef.current, s, 'initial'); };

  return (
    <Screen
      title="Documents"
      scroll={false}
      right={<Pressable onPress={() => navigation.navigate('Search')} hitSlop={10}><Ionicons name="search" size={24} color={colors.text} /></Pressable>}
    >
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          {FILTERS.map((f) => <Chip key={f.label} label={f.label} active={filter === filterKey(f)} onPress={() => pickFilter(filterKey(f))} />)}
        </ScrollView>
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sort:</Text>
          {SORTS.map((s) => (
            <Pressable key={s.key} onPress={() => pickSort(s.key)} style={[styles.sort, sort === s.key && styles.sortActive]}>
              <Text style={[styles.sortText, sort === s.key && { color: colors.primary }]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <LoadingView label="Loading documents…" />
      ) : error && !docs.length ? (
        <ErrorState message={error} onRetry={() => fetchPage(1, filter, sort, 'initial')} />
      ) : (
        <FlatList
          data={docs}
          keyExtractor={(d) => d.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
          renderItem={({ item }) => <DocumentCard doc={item} onPress={() => navigation.navigate('DocumentDetail', { id: item.id })} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchPage(1, filter, sort, 'refresh')} tintColor={colors.primary} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => { if (hasMore && !loadingMore && !loading) fetchPage(page + 1, filter, sort, 'more'); }}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={colors.primary} /> : null}
          ListEmptyComponent={
            <EmptyState
              title="No documents here"
              message={filter === 'All' ? 'Scan or upload a document to see it here.' : 'No documents match this filter.'}
              actionLabel={filter === 'All' ? 'Add document' : undefined}
              onAction={() => navigation.navigate('AddDocument')}
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sortRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 4 },
  sortLabel: { fontSize: 12, color: colors.textSecondary, marginRight: 8 },
  sort: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, marginRight: 6 },
  sortActive: { backgroundColor: colors.primaryLight },
  sortText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
});
