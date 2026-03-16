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
  glassBg: 'rgba(42, 42, 42, 0.5)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassHighlight: 'rgba(255, 255, 255, 0.04)',
  statusBarStyle: 'light-content',
};

/** Light theme — warm light background */
export const lightPalette: ThemePalette = {
  background: '#FBF8F5',
  backgroundAlt: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#5A5A5A',
  textMuted: '#8A8A8A',
  divider: '#E5E5E5',
  progressTrack: '#E5E5E5',
  progressFill: '#D4D4D4',
  primaryText: '#1A1A1A',
  secondaryText: '#5A5A5A',
  cardBase: '#FFFFFF',
  cardBaseAlpha: 'rgba(255, 255, 255, 0.95)',
  cardLighter: '#F5F5F5',
  accent: '#1A1A1A',
  success: '#16A34A',
  percent: '#E87C20',
  glassBg: 'rgba(255, 255, 255, 0.6)',
  glassBorder: 'rgba(0, 0, 0, 0.08)',
  glassHighlight: 'rgba(0, 0, 0, 0.04)',
  statusBarStyle: 'dark-content',
};

/** Resolve palette by resolved mode (light | dark). Extensible for future themes. */
export function getPaletteForMode(
  mode: 'light' | 'dark'
): ThemePalette {
  return mode === 'light' ? lightPalette : darkPalette;
}
