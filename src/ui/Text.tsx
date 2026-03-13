import React from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleSheet,
} from 'react-native';
import { Typography, Weight, Colors } from '../theme';

export type TextVariant =
  | 'large'
  | 'title'
  | 'greeting'
  | 'sectionTitle'
  | 'timer'
  | 'cardValue'
  | 'body'
  | 'caption'
  | 'titleApp'
  | 'label'
  | 'primaryValue'
  | 'secondaryValue'
  | 'secondaryBlock'
  | 'meta';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: 'primary' | 'secondary' | 'muted';
  opacity?: number;
}

const variantStyles = StyleSheet.create({
  large: { fontSize: Typography.large, fontWeight: Weight.semibold },
  title: { fontSize: Typography.title, fontWeight: Weight.semibold },
  greeting: { fontSize: Typography.greeting, fontWeight: Weight.semibold },
  sectionTitle: {
    fontSize: Typography.sectionTitle,
    fontWeight: Weight.medium,
  },
  timer: { fontSize: Typography.timer, fontWeight: Weight.bold },
  cardValue: { fontSize: Typography.cardValue, fontWeight: Weight.semibold },
  body: { fontSize: Typography.body, fontWeight: Weight.regular },
  caption: { fontSize: Typography.caption, fontWeight: Weight.medium },
  titleApp: { fontSize: Typography.titleApp, fontWeight: Weight.title },
  label: { fontSize: Typography.label, fontWeight: Weight.label },
  primaryValue: {
    fontSize: Typography.primaryValue,
    fontWeight: Weight.primaryValue,
  },
  secondaryValue: {
    fontSize: Typography.secondaryValue,
    fontWeight: Weight.secondary,
  },
  secondaryBlock: {
    fontSize: Typography.secondaryBlock,
    fontWeight: Weight.secondary,
  },
  meta: { fontSize: Typography.meta, fontWeight: Weight.secondary },
});

export function Text({
  variant = 'body',
  color = 'primary',
  opacity,
  style,
  ...props
}: TextProps) {
  const textColor =
    color === 'primary'
      ? Colors.textPrimary
      : color === 'muted'
      ? Colors.textMuted
      : Colors.textSecondary;
  const combinedStyle = [
    variantStyles[variant],
    { color: textColor },
    opacity !== undefined && { opacity },
    style,
  ].filter(Boolean);

  return <RNText style={combinedStyle} {...props} />;
}
