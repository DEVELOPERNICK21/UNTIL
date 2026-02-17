/**
 * MMKV instance and helpers
 * Use App Group ID for iOS to share with widget extension
 */

import { createMMKV } from 'react-native-mmkv';
import { DEFAULTS, STORAGE_KEYS } from './schema';

// Use default path for main app; extension will use App Group when configured
export const storage = createMMKV({
  id: 'until-storage',
  // iOS: path will be overridden via native config for App Groups
});

export function getString(key: string): string | undefined {
  return storage.getString(key);
}

export function setString(key: string, value: string): void {
  storage.set(key, value);
}

export function getNumber(key: string): number | undefined {
  return storage.getNumber(key);
}

export function setNumber(key: string, value: number): void {
  storage.set(key, value);
}

export function getBoolean(key: string): boolean | undefined {
  return storage.getBoolean(key);
}

export function setBoolean(key: string, value: boolean): void {
  storage.set(key, value);
}

export function remove(key: string): void {
  storage.remove(key);
}

export function clearAll(): void {
  storage.clearAll();
}

// Convenience getters with defaults
export function getBirthDate(): string | undefined {
  return getString(STORAGE_KEYS.USER_BIRTH_DATE);
}

export function getDeathAge(): number {
  return getNumber(STORAGE_KEYS.USER_DEATH_AGE) ?? DEFAULTS.USER_DEATH_AGE;
}

export function getTheme(): string {
  return getString(STORAGE_KEYS.SETTINGS_THEME) ?? DEFAULTS.SETTINGS_THEME;
}
