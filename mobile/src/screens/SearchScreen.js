import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DocumentCard from '../components/DocumentCard';
import { EmptyState, ErrorState } from '../components/States';
import { colors, radius } from '../constants/theme';
import { documentService } from '../services/documentService';
import { getErrorMessage } from '../utils/errors';

export default function SearchScreen({ navigation }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null); // null = nothing searched yet
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const reqId = useRef(0);

  // debounced call to the backend search API
  useEffect(() => {
    const term = q.trim();
    if (!term) { setResults(null); setError(null); setLoading(false); return undefined; }
    setLoading(true);
    const t = setTimeout(async () => {
      const id = ++reqId.current;
      try {
        const res = await documentService.search(term);
        if (id === reqId.current) { setResults(res.documents); setError(null); }
      } catch (err) {
        if (id === reqId.current) setError(getErrorMessage(err));
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.bar}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={styles.input}
          value={q}
          onChangeText={setQ}
          placeholder="Try “passport”, “insurance” or a name…"
          placeholderTextColor={colors.muted}
          autoFocus
          autoCapitalize="none"
          returnKeyType="search"
        />
        {loading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </View>

      {error ? (
        <ErrorState message={error} onRetry={() => setQ((x) => `${x} `)} />
      ) : results === null ? (
        <EmptyState icon="search-outline" title="Search your documents" message="Searches titles, types, categories, names, document numbers and the text read from your scans." />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(d) => d.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => <DocumentCard doc={item} onPress={() => navigation.navigate('DocumentDetail', { id: item.id })} />}
          ListHeaderComponent={results.length ? <Text style={styles.count}>{results.length} result{results.length === 1 ? '' : 's'}</Text> : null}
          ListEmptyComponent={loading ? null : <EmptyState icon="document-outline" title="No matches" message={`Nothing found for “${q.trim()}”.`} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, margin: 16, paddingHorizontal: 14 },
  input: { flex: 1, minHeight: 48, marginLeft: 8, fontSize: 15, color: colors.text },
  count: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
});
