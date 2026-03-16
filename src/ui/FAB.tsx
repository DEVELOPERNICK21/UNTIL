import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './Text';
import { useTheme, Shadows, Typography, FontFamily } from '../theme';

const SIZE = 56;

interface FABProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  active?: boolean;
}

export function FAB({ onPress, children, style, active = true }: FABProps) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.fab,
        { backgroundColor: theme.divider },
        active && { backgroundColor: theme.percent, ...Shadows.fab },
        style,
      ]}
    >
      <Text variant="label" color="primary" style={styles.fabLabel}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabLabel: {
    fontSize: Typography.title,
    fontFamily: FontFamily.regular,
  },
});
