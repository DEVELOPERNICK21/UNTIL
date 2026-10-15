const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** 1-based day index since trial start (day 1 = first 24h). */
export function getTrialDayIndex(trialStartMs: number, now: number = Date.now()): number {
  if (trialStartMs <= 0) return 0;
  return Math.floor((now - trialStartMs) / ONE_DAY_MS) + 1;
}
