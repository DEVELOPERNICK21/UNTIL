import React from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import { Radius, Spacing, useTheme } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  lighter?: boolean;
}

/**
 * Solid card — no Android elevation (avoids rectangular underlay on rounded corners).
 * Prefer GlassCard on atmospheric screens (Home, Settings, Paywall).
 */
export function Card({ children, style, lighter }: CardProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: lighter ? theme.cardLighter : theme.cardBaseAlpha,
          borderColor: theme.divider,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 12,
            },
            android: { elevation: 0 },
            default: {},
          }),
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
