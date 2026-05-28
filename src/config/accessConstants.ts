import { MONETIZATION_TRIAL_DAYS } from './monetization';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Shared durations for trial / event unlock (used by domain + native widget sync). */
export const TRIAL_DURATION_MS = MONETIZATION_TRIAL_DAYS * ONE_DAY_MS;
export const LIFE_EVENT_UNLOCK_MS = 24 * 60 * 60 * 1000;
