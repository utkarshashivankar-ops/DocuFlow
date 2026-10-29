import React from 'react';
import { View } from 'react-native';
import { colors, radius, shadow } from '../constants/theme';

export default function Card({ children, style }) {
  return (
    <View style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border }, shadow, style]}>
      {children}
    </View>
  );
}
