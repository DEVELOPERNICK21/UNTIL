import { MONETIZATION_TRIAL_DAYS } from './monetization';
import { MS_PER_DAY } from '../shared/time/constants';


/** Shared durations for trial / event unlock (used by domain + native widget sync). */
export const TRIAL_DURATION_MS = MONETIZATION_TRIAL_DAYS * MS_PER_DAY;
export const LIFE_EVENT_UNLOCK_MS = MS_PER_DAY;
