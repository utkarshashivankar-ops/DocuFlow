import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import Button from './Button';

export function LoadingView({ label = 'Loading…' }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.sub}>{label}</Text>
    </View>
  );
}

export function EmptyState({ icon = 'documents-outline', title, message, actionLabel, onAction }) {
  return (
    <View style={styles.center}>
      <View style={styles.iconWrap}><Ionicons name={icon} size={30} color={colors.primary} /></View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.sub}>{message}</Text> : null}
      {actionLabel ? <Button title={actionLabel} onPress={onAction} style={{ marginTop: 16, alignSelf: 'stretch' }} /> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <View style={styles.center}>
      <View style={[styles.iconWrap, { backgroundColor: '#FEE2E2' }]}><Ionicons name="cloud-offline-outline" size={30} color={colors.danger} /></View>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.sub}>{message}</Text>
      {onRetry ? <Button title="Try again" variant="secondary" onPress={onRetry} style={{ marginTop: 16, alignSelf: 'stretch' }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center' },
  sub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
