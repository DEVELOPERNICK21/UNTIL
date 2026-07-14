/**
 * Pure presence-streak logic (daily “noticed” habit).
 * Local calendar day keys: YYYY-MM-DD.
 */

export type PresenceStreakState = {
  count: number;
  longest: number;
  lastDateKey: string | null;
  /** Soft repair available (1 miss forgiven). */
  freezeAvailable: boolean;
  noticedToday: boolean;
};

export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(aKey: string, bKey: string): number {
  const a = parseKey(aKey).getTime();
  const b = parseKey(bKey).getTime();
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

export function recordPresenceDay(
  prev: PresenceStreakState,
  todayKey: string = localDateKey(),
): PresenceStreakState {
  if (prev.lastDateKey === todayKey) {
    return { ...prev, noticedToday: true };
  }

  if (!prev.lastDateKey) {
    return {
      count: 1,
      longest: Math.max(1, prev.longest),
      lastDateKey: todayKey,
      freezeAvailable: true,
      noticedToday: true,
    };
  }

  const gap = daysBetween(prev.lastDateKey, todayKey);

  if (gap === 1) {
    const count = prev.count + 1;
    return {
      count,
      longest: Math.max(prev.longest, count),
      lastDateKey: todayKey,
      freezeAvailable: prev.freezeAvailable,
      noticedToday: true,
    };
  }

  if (gap === 2 && prev.freezeAvailable) {
    // One missed day repaired — streak continues as if bridge day counted
    const count = prev.count + 1;
    return {
      count,
      longest: Math.max(prev.longest, count),
      lastDateKey: todayKey,
      freezeAvailable: false,
      noticedToday: true,
    };
  }

  // Broken — soft restart
  return {
    count: 1,
    longest: prev.longest,
    lastDateKey: todayKey,
    freezeAvailable: true,
    noticedToday: true,
  };
}

export const EMPTY_PRESENCE: PresenceStreakState = {
  count: 0,
  longest: 0,
  lastDateKey: null,
  freezeAvailable: true,
  noticedToday: false,
};
