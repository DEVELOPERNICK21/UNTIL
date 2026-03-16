import React from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleSheet,
} from 'react-native';
import { Typography, Weight, useTheme, FontScaling, getFontFamilyForWeight } from '../theme';

export type TextVariant =
  | 'large'
  | 'title'
  | 'headline'
  | 'display'
  | 'greeting'
  | 'sectionTitle'
  | 'timer'
  | 'cardValue'
  | 'body'
  | 'lead'
  | 'caption'
  | 'subtitle'
  | 'titleApp'
  | 'label'
  | 'primaryValue'
  | 'secondaryValue'
  | 'secondaryBlock'
  | 'meta'
  | 'small'
  | 'badge'
  | 'micro';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: 'primary' | 'secondary' | 'muted';
  opacity?: number;
  /** Override design system lock; default false so font size is consistent across devices */
  allowFontScaling?: boolean;
}

const variantStyles = StyleSheet.create({
  large: {
    fontSize: Typography.large,
    fontFamily: getFontFamilyForWeight(Weight.semibold),
  },
  title: {
    fontSize: Typography.title,
    fontFamily: getFontFamilyForWeight(Weight.semibold),
  },
  headline: {
    fontSize: Typography.headline,
    fontFamily: getFontFamilyForWeight(Weight.semibold),
  },
  display: {
    fontSize: Typography.display,
    fontFamily: getFontFamilyForWeight(Weight.bold),
  },
  greeting: {
    fontSize: Typography.greeting,
    fontFamily: getFontFamilyForWeight(Weight.semibold),
  },
  sectionTitle: {
    fontSize: Typography.sectionTitle,
    fontFamily: getFontFamilyForWeight(Weight.medium),
  },
  timer: {
    fontSize: Typography.timer,
    fontFamily: getFontFamilyForWeight(Weight.bold),
  },
  cardValue: {
    fontSize: Typography.cardValue,
    fontFamily: getFontFamilyForWeight(Weight.semibold),
  },
  body: {
    fontSize: Typography.body,
    fontFamily: getFontFamilyForWeight(Weight.regular),
  },
  lead: {
    fontSize: Typography.lead,
    fontFamily: getFontFamilyForWeight(Weight.regular),
  },
  caption: {
    fontSize: Typography.caption,
    fontFamily: getFontFamilyForWeight(Weight.medium),
  },
  subtitle: {
    fontSize: Typography.subtitle,
    fontFamily: getFontFamilyForWeight(Weight.semibold),
  },
  titleApp: {
    fontSize: Typography.titleApp,
    fontFamily: getFontFamilyForWeight(Weight.title),
  },
  label: {
    fontSize: Typography.label,
    fontFamily: getFontFamilyForWeight(Weight.label),
  },
  primaryValue: {
    fontSize: Typography.primaryValue,
    fontFamily: getFontFamilyForWeight(Weight.primaryValue),
  },
  secondaryValue: {
    fontSize: Typography.secondaryValue,
    fontFamily: getFontFamilyForWeight(Weight.secondary),
  },
  secondaryBlock: {
    fontSize: Typography.secondaryBlock,
    fontFamily: getFontFamilyForWeight(Weight.secondary),
  },
  meta: {
    fontSize: Typography.meta,
    fontFamily: getFontFamilyForWeight(Weight.secondary),
  },
  small: {
    fontSize: Typography.small,
    fontFamily: getFontFamilyForWeight(Weight.regular),
  },
  badge: {
    fontSize: Typography.badge,
    fontFamily: getFontFamilyForWeight(Weight.medium),
  },
  micro: {
    fontSize: Typography.micro,
    fontFamily: getFontFamilyForWeight(Weight.regular),
  },
});

export function Text({
  variant = 'body',
  color = 'primary',
  opacity,
  allowFontScaling = FontScaling.allowFontScaling,
  style,
  ...props
}: TextProps) {
  const theme = useTheme();
  const textColor =
    color === 'primary'
      ? theme.textPrimary
      : color === 'muted'
      ? theme.textMuted
      : theme.textSecondary;
  const combinedStyle = [
    variantStyles[variant],
    { color: textColor },
    opacity !== undefined && { opacity },
    style,
  ].filter(Boolean);

  return (
    <RNText
      allowFontScaling={allowFontScaling}
      style={combinedStyle}
      {...props}
    />
  );
}
