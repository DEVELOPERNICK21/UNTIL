import { MS_PER_DAY } from '../../../shared/time/constants';

/** 1-based day index since trial start (day 1 = first 24h). */
export function getTrialDayIndex(trialStartMs: number, now: number = Date.now()): number {
  if (trialStartMs <= 0) return 0;
  return Math.floor((now - trialStartMs) / MS_PER_DAY) + 1;
}
