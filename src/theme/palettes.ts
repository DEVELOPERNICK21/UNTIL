/**
 * Theme palettes — SSOT for semantic color tokens.
 * Components consume these via useTheme(); they never reference light/dark directly.
 */

export type StatusBarStyle = 'light-content' | 'dark-content';

export interface ThemePalette {
  background: string;
  backgroundAlt: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  divider: string;
  progressTrack: string;
  progressFill: string;
  primaryText: string;
  secondaryText: string;
  cardBase: string;
  cardBaseAlpha: string;
  cardLighter: string;
  accent: string;
  success: string;
  percent: string;
  glassBg: string;
  glassBorder: string;
  glassHighlight: string;
  /** For StatusBar barStyle; components never check light/dark directly */
  statusBarStyle: StatusBarStyle;
}

/** Dark theme — near-black monochrome (default app aesthetic) */
export const darkPalette: ThemePalette = {
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
  glassBg: 'rgba(255, 255, 255, 0.07)',
  glassBorder: 'rgba(255, 255, 255, 0.14)',
  glassHighlight: 'rgba(255, 255, 255, 0.08)',
  statusBarStyle: 'light-content',
};

/** Light theme — warm paper; glass stays readable (ink border, soft fill). */
export const lightPalette: ThemePalette = {
  background: '#F7F3EE',
  backgroundAlt: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#5A5A5A',
  textMuted: '#8A8A8A',
  divider: '#E0D8CF',
  progressTrack: '#E8E0D8',
  progressFill: '#C4B8AA',
  primaryText: '#1A1A1A',
  secondaryText: '#5A5A5A',
  cardBase: '#FFFFFF',
  cardBaseAlpha: 'rgba(255, 255, 255, 0.92)',
  cardLighter: '#FFF9F4',
  accent: '#1A1A1A',
  success: '#16A34A',
  percent: '#E87C20',
  glassBg: 'rgba(255, 255, 255, 0.78)',
  glassBorder: 'rgba(26, 26, 26, 0.10)',
  glassHighlight: 'rgba(255, 255, 255, 0.55)',
  statusBarStyle: 'dark-content',
};

/** Resolve palette by resolved mode (light | dark). Extensible for future themes. */
export function getPaletteForMode(
  mode: 'light' | 'dark'
): ThemePalette {
  return mode === 'light' ? lightPalette : darkPalette;
}
