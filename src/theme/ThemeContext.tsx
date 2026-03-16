/**
 * Theme context — provides current theme palette to the tree.
 * Components use useTheme() and consume tokens only; no dark/light checks.
 */

import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import type { ThemePalette } from './palettes';
import { useThemeStore } from '../stores/themeStore';
import { Appearance } from 'react-native';

const ThemeContext = createContext<ThemePalette | null>(null);

function subscribeToTheme(callback: () => void): () => void {
  const unsubStore = useThemeStore.subscribe(callback);
  const appearanceSub = Appearance.addChangeListener(callback);
  return () => {
    unsubStore();
    appearanceSub.remove();
  };
}

function getThemeSnapshot(): ThemePalette {
  return useThemeStore.getState().theme;
}

/** Hook: current theme palette. Use tokens (background, textPrimary, etc.); do not check dark/light. */
export function useTheme(): ThemePalette {
  const context = useContext(ThemeContext);
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getThemeSnapshot
  );
  if (context !== null) return context;
  return theme;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

/** Hydrates theme from storage and subscribes to system appearance when mode is system. */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getThemeSnapshot
  );
  const setSystemResolved = useThemeStore(s => s.setSystemResolved);
  const themeMode = useThemeStore(s => s.themeMode);
  const hydrate = useThemeStore(s => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (themeMode !== 'system') return;
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemResolved((colorScheme ?? 'dark') as 'light' | 'dark');
    });
    return () => sub.remove();
  }, [themeMode, setSystemResolved]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}
