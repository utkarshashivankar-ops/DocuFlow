import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { categoryMeta } from '../constants/categories';
import { colors, radius, shadow } from '../constants/theme';
import { daysText, formatDate } from '../utils/date';
import StatusBadge from './StatusBadge';

const BUSY = ['processing', 'extracting', 'classifying', 'uploading'];

export default function DocumentCard({ doc, onPress }) {
  const meta = categoryMeta(doc.category);
  const busy = BUSY.includes(doc.processingStatus);
  const failed = doc.processingStatus === 'failed';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, shadow, pressed && { opacity: 0.9 }]}>
      <View style={[styles.thumb, { backgroundColor: meta.bg }]}>
        {doc.thumbnailUrl ? (
          <Image source={{ uri: doc.thumbnailUrl }} style={styles.img} resizeMode="cover" />
        ) : (
          <Ionicons name={meta.icon} size={26} color={meta.color} />
        )}
      </View>

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.title} numberOfLines={1}>{doc.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>{doc.documentType} · {doc.category}</Text>
        {busy ? (
          <View style={styles.row}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.meta, { marginLeft: 6, color: colors.primary }]}>Processing…</Text>
          </View>
        ) : (
          <Text style={styles.meta} numberOfLines={1}>
            {doc.expiryDate ? `Expires ${formatDate(doc.expiryDate)} · ${daysText(doc.daysRemaining)}` : failed ? 'Needs review — processing failed' : 'No expiry date'}
          </Text>
        )}
        {doc.snippet ? <Text style={styles.snippet} numberOfLines={2}>{doc.snippet}</Text> : null}
      </View>

      {!busy ? <StatusBadge status={doc.status} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  thumb: { width: 56, height: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  img: { width: 56, height: 56 },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  snippet: { fontSize: 12, color: colors.muted, marginTop: 4, fontStyle: 'italic' },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
});
