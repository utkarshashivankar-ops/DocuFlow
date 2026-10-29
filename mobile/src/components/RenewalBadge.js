import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RENEWAL_STATUS } from '../constants/renewal';
import { radius } from '../constants/theme';

export default function RenewalBadge({ status }) {
  const s = RENEWAL_STATUS[status] || RENEWAL_STATUS['Not Started'];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Ionicons name={s.icon} size={12} color={s.color} />
      <Text style={[styles.text, { color: s.color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '700', marginLeft: 4 },
});
