/**
 * What the widgets and the Dynamic Island need to show Pause at a glance. Pure.
 *
 * Counts only: seconds practised per day, the daily goal and the level. Nothing about how anyone felt.
 * It carries the last two weeks by date instead of "today's minutes", so a widget that has not been
 * refreshed since yesterday still reads the right day by itself.
 */

import { DAILY_GOAL_SECONDS, levelFor, type LevelId, type PauseProgress } from './pauseProgress';

/** Enough for this week's dots (Monday first) wherever today falls in it. */
const GLANCE_DAYS = 14;

export interface PauseGlance {
  /** Seconds practised on a day, keyed by local date (YYYY-MM-DD). Days not listed are 0. */
  recent: Record<string, number>;
  goalSeconds: number;
  level: LevelId;
}

function previousDay(iso: string, back: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d - back);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export function buildPauseGlance(progress: PauseProgress, today: string): PauseGlance {
  const recent: Record<string, number> = {};
  for (let back = 0; back < GLANCE_DAYS; back += 1) {
    const date = previousDay(today, back);
    const seconds = progress.days[date] ?? 0;
    if (seconds > 0) recent[date] = Math.round(seconds);
  }
  return { recent, goalSeconds: DAILY_GOAL_SECONDS, level: levelFor(progress.totalSeconds).id };
}
