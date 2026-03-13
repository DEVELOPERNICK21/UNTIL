import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './Text';
import { Colors, Shadows } from '../theme';

const SIZE = 56;

interface FABProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  active?: boolean;
}

export function FAB({ onPress, children, style, active = true }: FABProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.fab, active && styles.fabActive, style]}
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
    backgroundColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabActive: {
    backgroundColor: Colors.accentOrange,
    ...Shadows.fab,
  },
  fabLabel: {
    fontSize: 22,
    fontWeight: '300',
  },
});
