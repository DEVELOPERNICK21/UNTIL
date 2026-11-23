/**
 * The gentle game around Pause: calm minutes, a daily goal, levels, a week view and milestones. Pure.
 *
 * Built so it can never make anyone feel worse:
 *   - no streak. Missing a day loses nothing; the week view only shows the days you did practise;
 *   - levels only go up, and every practice is open from the start;
 *   - nothing here records how anyone felt, what they picked or what they were worried about. Only
 *     how long they practised, which practice, and on which day.
 */

import type { PracticeId } from './practices';

export const DAILY_GOAL_SECONDS = 180;

/** Today's goal counts as reached when the minutes shown reach it, so the number and the ring always agree. */
export function goalReached(seconds: number): boolean {
  return calmMinutes(seconds) >= DAILY_GOAL_SECONDS / 60;
}

/** Minutes to show for some seconds: the nearest whole minute, but never "0" for time that really was practised. */
export function calmMinutes(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  return Math.max(1, Math.round(seconds / 60));
}
/** A practice shorter than this is not counted: someone who opened it and left has not practised. */
export const MIN_COUNTED_SECONDS = 20;
const KEEP_DAYS = 120;

export interface PauseProgress {
  /** Seconds practised on each day, keyed by local date (YYYY-MM-DD). */
  days: Record<string, number>;
  totalSeconds: number;
  sessions: number;
  /** Practices tried at least once. */
  tried: PracticeId[];
  /** Milestone ids, once earned always earned. */
  earned: string[];
}

export const EMPTY_PROGRESS: PauseProgress = {
  days: {},
  totalSeconds: 0,
  sessions: 0,
  tried: [],
  earned: [],
};

/** Levels by total calm seconds. They only go up. */
export const LEVELS = [
  { id: 'settling', minSeconds: 0 },
  { id: 'steady', minSeconds: 10 * 60 },
  { id: 'still', minSeconds: 30 * 60 },
  { id: 'deep', minSeconds: 75 * 60 },
  { id: 'tranquil', minSeconds: 150 * 60 },
] as const;
export type LevelId = (typeof LEVELS)[number]['id'];

export interface LevelInfo {
  id: LevelId;
  index: number;
  next: LevelId | null;
  /** 0 to 1 towards the next level; 1 at the top. */
  progress: number;
  secondsToNext: number;
}

export function levelFor(totalSeconds: number): LevelInfo {
  const total = Math.max(0, totalSeconds);
  let index = 0;
  LEVELS.forEach((level, i) => {
    if (total >= level.minSeconds) index = i;
  });
  const current = LEVELS[index];
  const next = LEVELS[index + 1];
  if (!next) return { id: current.id, index, next: null, progress: 1, secondsToNext: 0 };
  return {
    id: current.id,
    index,
    next: next.id,
    progress: (total - current.minSeconds) / (next.minSeconds - current.minSeconds),
    secondsToNext: next.minSeconds - total,
  };
}

export const MILESTONE_IDS = ['first', 'five', 'ten', 'explorer', 'week', 'night'] as const;
export type MilestoneId = (typeof MILESTONE_IDS)[number];

/** Distinct practices to try for "explorer": all six. */
export const EXPLORER_COUNT = 6;

function dateParts(iso: string): [number, number, number] {
  const [y, m, d] = iso.split('-').map(Number);
  return [y, m - 1, d];
}

function addDays(iso: string, delta: number): string {
  const [y, m, d] = dateParts(iso);
  const date = new Date(y, m, d + delta);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

/** The seven days of the week that contains `today`, Monday first. */
export function weekDays(
  progress: PauseProgress,
  today: string,
): Array<{ date: string; seconds: number; practised: boolean; isToday: boolean }> {
  const [y, m, d] = dateParts(today);
  const weekday = (new Date(y, m, d).getDay() + 6) % 7; // Monday = 0
  const monday = addDays(today, -weekday);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const seconds = progress.days[date] ?? 0;
    return { date, seconds, practised: seconds >= MIN_COUNTED_SECONDS, isToday: date === today };
  });
}

export function secondsToday(progress: PauseProgress, today: string): number {
  return progress.days[today] ?? 0;
}

export interface SessionRecord {
  practice: PracticeId;
  seconds: number;
  /** Local date, YYYY-MM-DD. */
  date: string;
  /** Local hour, 0 to 23. */
  hour: number;
}

export function recordSession(progress: PauseProgress, session: SessionRecord): PauseProgress {
  const seconds = Math.round(session.seconds);
  if (!Number.isFinite(seconds) || seconds < MIN_COUNTED_SECONDS) return progress;

  const days = { ...progress.days, [session.date]: (progress.days[session.date] ?? 0) + seconds };
  const kept = Object.keys(days).sort().slice(-KEEP_DAYS);
  const trimmed: Record<string, number> = {};
  kept.forEach(key => {
    trimmed[key] = days[key];
  });

  const next: PauseProgress = {
    days: trimmed,
    totalSeconds: progress.totalSeconds + seconds,
    sessions: progress.sessions + 1,
    tried: progress.tried.includes(session.practice)
      ? progress.tried
      : [...progress.tried, session.practice],
    earned: progress.earned,
  };

  const earned = new Set(progress.earned);
  const practisedThisWeek = weekDays(next, session.date).filter(day => day.practised).length;
  if (next.sessions >= 1) earned.add('first');
  if (next.sessions >= 5) earned.add('five');
  if (next.sessions >= 10) earned.add('ten');
  if (next.tried.length >= EXPLORER_COUNT) earned.add('explorer');
  if (practisedThisWeek >= 3) earned.add('week');
  if (session.hour >= 21 || session.hour < 5) earned.add('night');
  return { ...next, earned: MILESTONE_IDS.filter(id => earned.has(id)) };
}

export function newMilestones(before: PauseProgress, after: PauseProgress): MilestoneId[] {
  return MILESTONE_IDS.filter(id => after.earned.includes(id) && !before.earned.includes(id));
}

/** Tolerant reader for what was stored: anything unexpected becomes the empty value, never an error. */
export function sanitizeProgress(raw: unknown): PauseProgress {
  if (raw == null || typeof raw !== 'object') return EMPTY_PROGRESS;
  const r = raw as Record<string, unknown>;
  const days: Record<string, number> = {};
  if (r.days && typeof r.days === 'object') {
    Object.entries(r.days as Record<string, unknown>).forEach(([key, value]) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(key) && typeof value === 'number' && Number.isFinite(value) && value > 0) {
        days[key] = Math.round(value);
      }
    });
  }
  const count = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v) : 0);
  const known = new Set<string>(['sigh', 'coherent', 'box', 'extended', 'wind', 'grounding']);
  const tried = Array.isArray(r.tried)
    ? ([...new Set(r.tried.filter((v): v is string => typeof v === 'string' && known.has(v)))] as PracticeId[])
    : [];
  const earned = Array.isArray(r.earned)
    ? MILESTONE_IDS.filter(id => (r.earned as unknown[]).includes(id))
    : [];
  return { days, totalSeconds: count(r.totalSeconds), sessions: count(r.sessions), tried, earned };
}
