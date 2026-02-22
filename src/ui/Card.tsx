import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Shadows, Spacing } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  lighter?: boolean;
}

export function Card({ children, style, lighter }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        lighter && styles.cardLighter,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBaseAlpha,
    borderRadius: Radius.lg,
    padding: Spacing[3],
    ...Shadows.card,
  },
  cardLighter: {
    backgroundColor: Colors.cardLighter,
  },
});
