/**
 * The hour timer on the desktop island: start, pause, reset. The same shape as the phone's timer
 * (running, when this run began, time banked before it), kept in local storage so it survives a
 * restart and every window sees the same one.
 */

export interface HourTimer {
  running: boolean;
  /** When the current run began, in ms since the epoch. Zero when stopped. */
  startMs: number;
  /** Time banked before the current run. */
  elapsedMs: number;
}

export const IDLE_TIMER: HourTimer = { running: false, startMs: 0, elapsedMs: 0 };

const KEY = 'until.desktop.hourTimer';
const HOUR_MS = 3_600_000;

export function timerMs(timer: HourTimer, nowMs: number): number {
  if (timer.running && timer.startMs > 0) {
    return Math.max(0, timer.elapsedMs + nowMs - timer.startMs);
  }
  return Math.max(0, timer.elapsedMs);
}

/** Start it if it is stopped, pause it if it is running. */
export function toggleTimer(timer: HourTimer, nowMs: number): HourTimer {
  if (timer.running) {
    return { running: false, startMs: 0, elapsedMs: timerMs(timer, nowMs) };
  }
  return { running: true, startMs: nowMs, elapsedMs: Math.max(0, timer.elapsedMs) };
}

export function resetTimer(): HourTimer {
  return IDLE_TIMER;
}

/** `H:MM:SS`, or `M:SS` under an hour. */
export function formatTimer(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** How far through the current hour the timer is, 0..1. */
export function hourFraction(ms: number): number {
  return (Math.max(0, ms) % HOUR_MS) / HOUR_MS;
}

export function timerStatus(timer: HourTimer): 'running' | 'paused' | 'ready' {
  if (timer.running) return 'running';
  return timer.elapsedMs > 0 ? 'paused' : 'ready';
}

function isTimer(value: unknown): value is HourTimer {
  const t = value as HourTimer;
  return (
    !!t &&
    typeof t.running === 'boolean' &&
    Number.isFinite(t.startMs) &&
    Number.isFinite(t.elapsedMs)
  );
}

export function loadTimer(storage: Pick<Storage, 'getItem'> = localStorage): HourTimer {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(KEY) ?? 'null');
    return isTimer(parsed) ? parsed : IDLE_TIMER;
  } catch {
    return IDLE_TIMER;
  }
}

export function saveTimer(timer: HourTimer, storage: Pick<Storage, 'setItem'> = localStorage): void {
  try {
    storage.setItem(KEY, JSON.stringify(timer));
  } catch {
    // A timer that is not saved still runs.
  }
}

export const TIMER_STORAGE_KEY = KEY;
