/**
 * When to offer the daily check-in reminder to someone who has not turned it on. Pure rules; the
 * screens only ask this and record the answer.
 */

import { MS_PER_DAY } from '../../../shared/time/constants';

/** Past the first-run coaches (widget, feature) so the offer never stacks on them. */
export const REMINDER_OPT_IN_MIN_APP_OPENS = 5;
export const REMINDER_OPT_IN_MAX_ASKS = 2;
export const REMINDER_OPT_IN_RETRY_AFTER_MS = 5 * MS_PER_DAY;

export interface ReminderOptInInput {
  appOpenCount: number;
  remindersEnabled: boolean;
  asksSoFar: number;
  lastAskedAt: number | null;
  now: number;
  /** They told onboarding they only want widgets, so do not nag. */
  widgetsOnly: boolean;
}

export function shouldOfferReminderOptIn(input: ReminderOptInInput): boolean {
  if (input.remindersEnabled || input.widgetsOnly) return false;
  if (input.appOpenCount < REMINDER_OPT_IN_MIN_APP_OPENS) return false;
  if (input.asksSoFar >= REMINDER_OPT_IN_MAX_ASKS) return false;
  if (
    input.lastAskedAt != null &&
    input.now - input.lastAskedAt < REMINDER_OPT_IN_RETRY_AFTER_MS
  ) {
    return false;
  }
  return true;
}
