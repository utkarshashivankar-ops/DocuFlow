import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../constants/theme';

const VARIANTS = {
  primary: { bg: colors.primary, fg: '#fff', border: colors.primary },
  secondary: { bg: colors.primaryLight, fg: colors.primary, border: colors.primaryLight },
  outline: { bg: 'transparent', fg: colors.text, border: colors.border },
  danger: { bg: '#FEE2E2', fg: colors.danger, border: '#FEE2E2' },
  ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
};

export default function Button({ title, onPress, variant = 'primary', loading, disabled, icon, style, small }) {
  const v = VARIANTS[variant];
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.btn,
        small && styles.small,
        { backgroundColor: v.bg, borderColor: v.border, opacity: off ? 0.55 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={small ? 16 : 18} color={v.fg} style={{ marginRight: 6 }} /> : null}
          <Text style={[styles.text, small && { fontSize: 13 }, { color: v.fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { minHeight: 48, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  small: { minHeight: 38, paddingHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { fontSize: 15, fontWeight: '600' },
});
