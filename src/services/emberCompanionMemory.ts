/**
 * Persistence for Ember companion tips: first-auto per route + rotation cursor.
 */

import { STORAGE_KEYS } from '../persistence/schema';
import { getString, setString } from '../persistence/mmkv';

function readMap(key: string): Record<string, number> {
  try {
    const raw = getString(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(key: string, map: Record<string, number>): void {
  setString(key, JSON.stringify(map));
}

/** True if this route already auto-showed its intro tip. */
export function hasEmberIntroBeenShown(routeName: string): boolean {
  const map = readMap(STORAGE_KEYS.EMBER_TIP_INTRO_SEEN);
  return map[routeName] === 1;
}

export function markEmberIntroShown(routeName: string): void {
  const map = readMap(STORAGE_KEYS.EMBER_TIP_INTRO_SEEN);
  map[routeName] = 1;
  writeMap(STORAGE_KEYS.EMBER_TIP_INTRO_SEEN, map);
}

/**
 * Advances tip cursor for a route and returns the next index in [0, poolSize).
 * Avoids repeating the previous tip when the pool has 2+ lines.
 */
export function nextEmberTipIndex(routeName: string, poolSize: number): number {
  if (poolSize <= 0) return 0;
  const map = readMap(STORAGE_KEYS.EMBER_TIP_CURSOR);
  const prev = map[routeName] ?? -1;
  let next = (prev + 1) % poolSize;
  if (poolSize > 1 && next === prev) {
    next = (next + 1) % poolSize;
  }
  map[routeName] = next;
  writeMap(STORAGE_KEYS.EMBER_TIP_CURSOR, map);
  return next;
}

/** Peek current cursor without advancing (for first-visit intro = index 0). */
export function peekEmberTipIndex(routeName: string): number {
  const map = readMap(STORAGE_KEYS.EMBER_TIP_CURSOR);
  return map[routeName] ?? 0;
}

export function setEmberTipIndex(routeName: string, index: number): void {
  const map = readMap(STORAGE_KEYS.EMBER_TIP_CURSOR);
  map[routeName] = index;
  writeMap(STORAGE_KEYS.EMBER_TIP_CURSOR, map);
}
