import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Radius, Spacing, useTheme } from '../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Consistent glass surface — same opacity on every card.
 * No elevation/shadow layers (those caused the inner square on Android/iOS).
 */
export function GlassCard({ children, style }: GlassCardProps) {
  const theme = useTheme();
  const isLight = theme.statusBarStyle === 'dark-content';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isLight
            ? 'rgba(255, 255, 255, 0.92)'
            : 'rgba(40, 40, 46, 0.72)',
          borderColor: isLight
            ? 'rgba(26, 26, 26, 0.08)'
            : 'rgba(255, 255, 255, 0.18)',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing[3],
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
  },
});
