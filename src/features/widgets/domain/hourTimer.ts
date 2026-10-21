/**
 * The hour timer (the widget's one stopwatch). Pure rules, shared by the screen and the sync code.
 *
 * The same JSON is read and written by the Android widget, the iOS widget and the Dynamic Island, so
 * the field names and the arithmetic match theirs: elapsed = totalElapsedMs + (running ? now - startTimeMs : 0).
 */

import { MAX_TITLE_LENGTH } from '../../../config/inputLimits';

export interface HourTimerState {
  title: string;
  isRunning: boolean;
  /** When the current run started (epoch ms). 0 while stopped. */
  startTimeMs: number;
  /** Time banked from earlier runs. */
  totalElapsedMs: number;
}

export const DEFAULT_TIMER_TITLE = 'Hour timer';

export const DEFAULT_HOUR_TIMER: HourTimerState = {
  title: DEFAULT_TIMER_TITLE,
  isRunning: false,
  startTimeMs: 0,
  totalElapsedMs: 0,
};

function nonNegativeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function normalizeTimerTitle(raw: unknown): string {
  if (typeof raw !== 'string') return DEFAULT_TIMER_TITLE;
  return raw.trim().slice(0, MAX_TITLE_LENGTH).trim() || DEFAULT_TIMER_TITLE;
}

/** Reads the stored state, whatever shape it is in. Anything unusable becomes the stopped default. */
export function parseHourTimerState(raw: unknown): HourTimerState {
  if (!raw || typeof raw !== 'object') return DEFAULT_HOUR_TIMER;
  const o = raw as Record<string, unknown>;
  const startTimeMs = nonNegativeNumber(o.startTimeMs);
  // "Running" with no start time is a half-written state: treat it as stopped rather than counting from 1970.
  const isRunning = Boolean(o.isRunning) && startTimeMs > 0;
  return {
    title: typeof o.title === 'string' ? o.title : DEFAULT_TIMER_TITLE,
    isRunning,
    startTimeMs: isRunning ? startTimeMs : 0,
    totalElapsedMs: nonNegativeNumber(o.totalElapsedMs),
  };
}

/** Time on the clock now. Never negative, even if the phone's clock was set back while it ran. */
export function elapsedMs(state: HourTimerState, now: number): number {
  const running = state.isRunning && state.startTimeMs > 0 ? Math.max(0, now - state.startTimeMs) : 0;
  return Math.max(0, state.totalElapsedMs) + running;
}

/** Start it, or stop it and bank the time. */
export function toggleTimer(state: HourTimerState, now: number): HourTimerState {
  if (state.isRunning) {
    return {
      ...state,
      isRunning: false,
      startTimeMs: 0,
      totalElapsedMs: elapsedMs(state, now),
    };
  }
  return { ...state, isRunning: true, startTimeMs: now };
}

/** Back to 0:00:00 and stopped, keeping the title. */
export function resetTimer(state: HourTimerState): HourTimerState {
  return { title: state.title, isRunning: false, startTimeMs: 0, totalElapsedMs: 0 };
}

export function formatElapsed(ms: number): string {
  const totalSec = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
