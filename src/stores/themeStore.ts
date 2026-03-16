/**
 * Theme store — SSOT for theme state.
 * Persists theme choice to AsyncStorage; supports light, dark, system.
 */

import { create } from 'zustand';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemePalette } from '../theme/palettes';
import {
  getPaletteForMode,
  darkPalette,
} from '../theme/palettes';
import { STORAGE_KEYS } from '../persistence/schema';
import type { StoredTheme } from '../persistence/schema';

type ResolvedMode = 'light' | 'dark';

function resolveTheme(mode: StoredTheme): ResolvedMode {
  if (mode === 'system') {
    return (Appearance.getColorScheme() ?? 'dark') as ResolvedMode;
  }
  return mode;
}

interface ThemeState {
  themeMode: StoredTheme;
  resolvedTheme: ResolvedMode;
  theme: ThemePalette;
  /** Set user preference and persist to AsyncStorage */
  setThemeMode: (mode: StoredTheme) => Promise<void>;
  /** Called when system appearance changes; only applies when themeMode === 'system' */
  setSystemResolved: (resolved: ResolvedMode) => void;
  /** Load persisted theme from AsyncStorage (call once at app init) */
  hydrate: () => Promise<void>;
}

const THEME_STORAGE_KEY = STORAGE_KEYS.SETTINGS_THEME;

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeMode: 'system',
  resolvedTheme: resolveTheme('system'),
  theme: getPaletteForMode(resolveTheme('system')),

  setThemeMode: async (mode: StoredTheme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // ignore persistence errors
    }
    const resolved = resolveTheme(mode);
    set({
      themeMode: mode,
      resolvedTheme: resolved,
      theme: getPaletteForMode(resolved),
    });
  },

  setSystemResolved: (resolved: ResolvedMode) => {
    const { themeMode } = get();
    if (themeMode !== 'system') return;
    set({
      resolvedTheme: resolved,
      theme: getPaletteForMode(resolved),
    });
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      const mode: StoredTheme =
        stored === 'light' || stored === 'dark' || stored === 'system'
          ? stored
          : 'system';
      const resolved = resolveTheme(mode);
      set({
        themeMode: mode,
        resolvedTheme: resolved,
        theme: getPaletteForMode(resolved),
      });
    } catch {
      set({
        themeMode: 'system',
        resolvedTheme: resolveTheme('system'),
        theme: darkPalette,
      });
    }
  },
}));
