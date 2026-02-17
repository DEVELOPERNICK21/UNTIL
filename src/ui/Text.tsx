import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { Typography, Weight, Colors } from '../theme';

export type TextVariant =
  | 'titleApp'
  | 'label'
  | 'primaryValue'
  | 'secondaryValue'
  | 'secondaryBlock'
  | 'meta';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: 'primary' | 'secondary';
  opacity?: number;
}

const variantStyles = StyleSheet.create({
  titleApp: { fontSize: Typography.titleApp, fontWeight: Weight.title },
  label: { fontSize: Typography.label, fontWeight: Weight.label },
  primaryValue: { fontSize: Typography.primaryValue, fontWeight: Weight.primaryValue },
  secondaryValue: { fontSize: Typography.secondaryValue, fontWeight: Weight.secondary },
  secondaryBlock: { fontSize: Typography.secondaryBlock, fontWeight: Weight.secondary },
  meta: { fontSize: Typography.meta, fontWeight: Weight.secondary },
});

export function Text({
  variant = 'label',
  color = 'primary',
  opacity,
  style,
  ...props
}: TextProps) {
  const textColor = color === 'primary' ? Colors.primaryText : Colors.secondaryText;
  const combinedStyle = [
    variantStyles[variant],
    { color: textColor },
    opacity !== undefined && { opacity },
    style,
  ].filter(Boolean);

  return <RNText style={combinedStyle} {...props} />;
}
