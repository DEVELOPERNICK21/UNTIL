/**
 * Syncs anonymous person properties to PostHog from access / onboarding state.
 */

import { Platform } from 'react-native';
import type { AccessState } from '../types';
import { TRIAL_DURATION_MS } from '../config/accessConstants';
import { setPostHogPersonProperties } from './posthogClient';
import { setCrashAttributes } from './analytics';

export function buildAnalyticsUserProperties(input: {
  access: AccessState;
  onboardingComplete: boolean;
  appVersion?: string;
}): Record<string, string | number | boolean> {
  const { access, onboardingComplete, appVersion } = input;
  const trialDaysRemaining =
    access.trialEndsAt != null && access.trialActive
      ? Math.max(
          0,
          Math.ceil((access.trialEndsAt - Date.now()) / (24 * 60 * 60 * 1000))
        )
      : 0;

  return {
    is_premium: access.isPremium,
    trial_active: access.trialActive,
    trial_days_remaining: trialDaysRemaining,
    app_open_count: access.appOpenCount,
    onboarding_complete: onboardingComplete,
    platform: Platform.OS,
    ...(appVersion ? { app_version: appVersion } : {}),
  };
}

export function syncAnalyticsUserProperties(input: {
  access: AccessState;
  onboardingComplete: boolean;
  appVersion?: string;
}): void {
  const props = buildAnalyticsUserProperties(input);
  setPostHogPersonProperties(props);
  setCrashAttributes({
    is_premium: props.is_premium,
    trial_active: props.trial_active,
    onboarding_complete: props.onboarding_complete,
    platform: props.platform,
    ...(typeof props.app_version === 'string'
      ? { app_version: props.app_version }
      : {}),
  });
}

export function getTrialDurationDays(): number {
  return Math.round(TRIAL_DURATION_MS / (24 * 60 * 60 * 1000));
}
