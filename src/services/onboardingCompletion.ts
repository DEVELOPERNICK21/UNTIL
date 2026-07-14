/**
 * Side effects when user finishes shortened onboarding (reach Home).
 */

import { setNumber } from '../persistence/mmkv';
import { STORAGE_KEYS } from '../persistence/schema';
import { setWidgetCoachPendingUseCase } from '../di';
import { logAnalyticsEvent } from './analytics';
import { scheduleDay2ReengagementNotification } from './engagementNotifications';

export type OnboardingExitParams = {
  exit_type: 'skipped' | 'completed';
  step: number;
  step_name: string;
};

export function runOnboardingCompletionSideEffects(
  params?: OnboardingExitParams
): void {
  setWidgetCoachPendingUseCase.execute();
  setNumber(STORAGE_KEYS.ONBOARDING_COMPLETED_AT, Date.now());
  void logAnalyticsEvent('onboarding_complete', params);
  void scheduleDay2ReengagementNotification();
}
