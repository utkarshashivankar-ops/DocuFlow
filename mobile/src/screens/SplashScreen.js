import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';

export default function SplashScreen() {
  return (
    <View style={styles.wrap}>
      <View style={styles.logo}><Ionicons name="documents" size={44} color={colors.primary} /></View>
      <Text style={styles.name}>DocuFlow</Text>
      <Text style={styles.tag}>Secure · Simple · Organized · Intelligent</Text>
      <ActivityIndicator color="#fff" style={{ marginTop: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 88, height: 88, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 32, fontWeight: '800', color: '#fff', marginTop: 16 },
  tag: { fontSize: 13, color: '#C7D2FE', marginTop: 6 },
});
