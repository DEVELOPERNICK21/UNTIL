import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme, Radius, Shadows, Spacing } from '../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Soft glass surface — translucent fill, highlight edge, inset sheen.
 * Native OS widgets cannot blur; this is the in-app / preview look.
 */
export function GlassCard({ children, style }: GlassCardProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.glassBg,
          borderColor: theme.glassBorder,
          ...Shadows.glass,
        },
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={[styles.sheen, { backgroundColor: theme.glassHighlight }]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing[3],
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
});
