/**
 * UNTIL design system — near-black monochrome
 * No accent. Time confrontation, clarity, reality.
 */

export const Colors = {
  background: '#0E0E10',
  backgroundAlt: '#111111',

  textPrimary: '#EDEDED',
  textSecondary: '#9A9A9A',
  textMuted: '#9A9A9A',

  divider: '#2A2A2A',
  progressTrack: '#2A2A2A',
  progressFill: '#3D3D3D',

  // Legacy aliases
  primaryText: '#EDEDED',
  secondaryText: '#9A9A9A',
  cardBase: '#111111',
  cardBaseAlpha: 'rgba(17, 17, 17, 0.95)',
  cardLighter: '#1A1A1A',
  accent: '#EDEDED',
  success: '#22AA22',
  percent: '#E87C20',
} as const;

export const Typography = {
  large: 32,
  title: 22,
  sectionTitle: 16,
  body: 15,
  caption: 13,
  small: 12,
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
} as const;

export const Gradient = {
  screenBackground: [Colors.background, Colors.background] as const,
} as const;

export { getProgressColor, PROGRESS_COLOR_START, PROGRESS_COLOR_MID, PROGRESS_COLOR_END } from './progressColor';

export const spacing = Spacing;
export const typography = {} as const;
export const colors = {} as const;