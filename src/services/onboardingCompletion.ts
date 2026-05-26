/**
 * Side effects when user finishes shortened onboarding (reach Home).
 */

import { getString, setString, setNumber } from '../persistence/mmkv';
import { STORAGE_KEYS } from '../persistence/schema';
import { logAnalyticsEvent } from './analytics';
import { scheduleDay2ReengagementNotification } from './engagementNotifications';

export function runOnboardingCompletionSideEffects(): void {
  setString(STORAGE_KEYS.WIDGET_COACH_PENDING, '1');
  setNumber(STORAGE_KEYS.ONBOARDING_COMPLETED_AT, Date.now());
  void logAnalyticsEvent('onboarding_complete');
  void scheduleDay2ReengagementNotification();
}

export function isWidgetCoachPending(): boolean {
  return getString(STORAGE_KEYS.WIDGET_COACH_PENDING) === '1';
}

export function clearWidgetCoachPending(): void {
  setString(STORAGE_KEYS.WIDGET_COACH_PENDING, '');
}
