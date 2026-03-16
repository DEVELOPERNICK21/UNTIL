import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme, Radius, Shadows, Spacing } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  lighter?: boolean;
}

export function Card({ children, style, lighter }: CardProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.cardBaseAlpha },
        lighter && { backgroundColor: theme.cardLighter },
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
    ...Shadows.card,
  },
});
