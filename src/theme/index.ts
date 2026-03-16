/**
 * UNTIL design system — design tokens and palettes.
 * Components consume theme via useTheme(); do not reference light/dark directly.
 */

export {
  darkPalette,
  lightPalette,
  getPaletteForMode,
  type ThemePalette,
} from './palettes';

/** @deprecated Use useTheme() and theme tokens instead. Kept for migration. */
export const Colors = {
  background: '#0E0E10',
  backgroundAlt: '#111111',
  textPrimary: '#EDEDED',
  textSecondary: '#9A9A9A',
  textMuted: '#9A9A9A',
  divider: '#2A2A2A',
  progressTrack: '#2A2A2A',
  progressFill: '#3D3D3D',
  primaryText: '#EDEDED',
  secondaryText: '#9A9A9A',
  cardBase: '#111111',
  cardBaseAlpha: 'rgba(17, 17, 17, 0.95)',
  cardLighter: '#1A1A1A',
  accent: '#EDEDED',
  success: '#22AA22',
  percent: '#E87C20',
  glassBg: 'rgba(42, 42, 42, 0.5)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassHighlight: 'rgba(255, 255, 255, 0.04)',
} as const;

/** Splash screen palette — light theme, single SSOT for splash UI */
export const SplashColors = {
  background: '#FBF8F5',
  cardBg: '#FFFFFF',
  accent: Colors.percent,
  textPrimary: '#1A1A1A',
  textSecondary: '#E87C20',
  textMuted: '#8A8A8A',
  progressTrack: '#E5E5E5',
  progressFill: Colors.percent,
  footer: '#C4C4C4',
  iconShadow: 'rgba(0,0,0,0.08)',
} as const;

/** Font sizes — SSOT; use these only. Locked per device (no system scaling). */
export const Typography = {
  large: 32,
  title: 22,
  headline: 26,
  display: 28,
  sectionTitle: 16,
  body: 15,
  lead: 17,
  caption: 13,
  subtitle: 14,
  small: 12,
  badge: 11,
  micro: 10,
  greeting: 18,
  timer: 38,
  cardValue: 20,
  titleApp: 14,
  label: 16,
  primaryValue: 56,
  secondaryValue: 18,
  secondaryBlock: 20,
  meta: 13,
} as const;

/** App-wide: disable system font scaling so sizes stay consistent across devices. */
export const FontScaling = { allowFontScaling: false } as const;

export const Weight = {
  bold: '700' as const,
  semibold: '600' as const,
  medium: '500' as const,
  regular: '400' as const,
  title: '500' as const,
  label: '400' as const,
  primaryValue: '300' as const,
  secondary: '400' as const,
};

/** Inter 18pt — SSOT for app typography (src/assets/fonts) */
export const FontFamily = {
  regular: 'Inter_18pt-Regular',
  medium: 'Inter_18pt-Medium',
  bold: 'Inter_18pt-Bold',
} as const;

/** Resolve font family from fontWeight string (400/500/600/700) for Inter */
export function getFontFamilyForWeight(
  weight: string
): (typeof FontFamily)[keyof typeof FontFamily] {
  switch (weight) {
    case Weight.bold:
      return FontFamily.bold;
    case Weight.semibold:
    case Weight.medium:
    case Weight.title:
      return FontFamily.medium;
    default:
      return FontFamily.regular;
  }
}

export const Spacing = {
  1: 4,
  2: 8,
  3: 16,
  4: 24,
  5: 32,
  6: 40,
  7: 48,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 64,
} as const;

export const Radius = {
  sm: 12,
  md: 16,
  lg: 20,
  full: 999,
} as const;

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  fab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
} as const;

/** Default gradient (dark). Prefer useTheme().theme.background in ScreenGradient. */
export const Gradient = {
  screenBackground: ['#0E0E10', '#0E0E10'] as const,
} as const;

export {
  getProgressColor,
  PROGRESS_COLOR_START,
  PROGRESS_COLOR_MID,
  PROGRESS_COLOR_END,
} from './progressColor';

export const spacing = Spacing;
export const typography = {} as const;
export const colors = {} as const;

export { ThemeProvider, useTheme } from './ThemeContext';
