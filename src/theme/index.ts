/**
 * UNTIL design tokens — exact, systematic
 * Calm, seriousness, restraint. No decoration.
 */

export const Typography = {
  titleApp: 14,
  label: 16,
  primaryValue: 56,
  secondaryValue: 18,
  secondaryBlock: 20,
  meta: 13,
} as const;

export const Weight = {
  title: '500' as const,
  label: '400' as const,
  primaryValue: '300' as const,
  secondary: '400' as const,
};

export const Colors = {
  background: '#0E0E10',
  primaryText: '#EDEDED',
  secondaryText: '#9A9A9A',
  divider: '#2A2A2A',
  accent: '#EDEDED',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 64,
} as const;

/** @deprecated Use Typography, Weight, Colors, Spacing directly */
export const typography = {
  title: { fontSize: Typography.titleApp, fontWeight: Weight.title },
  label: { fontSize: Typography.label, fontWeight: Weight.label },
  primaryValue: { fontSize: Typography.primaryValue, fontWeight: Weight.primaryValue },
  secondaryValue: { fontSize: Typography.secondaryValue, fontWeight: Weight.secondary },
  secondaryBlock: { fontSize: Typography.secondaryBlock, fontWeight: Weight.secondary },
  meta: { fontSize: Typography.meta, fontWeight: Weight.secondary },
};

/** @deprecated Use Colors directly */
export const colors = {
  light: {
    background: Colors.background,
    text: Colors.primaryText,
    textSecondary: Colors.secondaryText,
    surface: Colors.divider,
    primary: Colors.accent,
    accent: Colors.accent,
  },
  dark: {
    background: Colors.background,
    text: Colors.primaryText,
    textSecondary: Colors.secondaryText,
    surface: Colors.divider,
    primary: Colors.accent,
    accent: Colors.accent,
  },
};

/** @deprecated Use Spacing directly */
export const spacing = Spacing;
