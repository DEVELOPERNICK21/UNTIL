/**
 * Product analytics — Firebase + PostHog when configured.
 * Safe no-op when unavailable (local dev without keys).
 */

import {
  capturePostHogEvent,
  getPostHogClient,
} from './posthogClient';

export type AnalyticsPaywallSource =
  | 'premium_screen'
  | 'deferred_paywall'
  | 'onboarding_paywall'
  | 'trial_ending_modal'
  | 'widget_gate'
  | 'unknown';

export type AnalyticsEventName =
  | 'app_open'
  | 'onboarding_step'
  | 'identity_setup_complete'
  | 'life_preview_seen'
  | 'onboarding_paywall_seen'
  | 'onboarding_complete'
  | 'widget_add_tapped'
  | 'widget_coach_shown'
  | 'widget_coach_dismissed'
  | 'premium_viewed'
  | 'deferred_paywall_shown'
  | 'deferred_paywall_dismissed'
  | 'reflection_seen'
  | 'reflection_dismissed'
  | 'reflection_tone_changed'
  | 'reflection_birthdate_cta_tapped'
  | 'retention_notification_scheduled'
  | 'retention_notification_disabled'
  | 'retention_notification_enabled'
  | 'screen_view'
  | 'premium_purchase_started'
  | 'premium_purchase_completed'
  | 'premium_purchase_failed'
  | 'premium_purchase_cancelled'
  | 'premium_restore_completed'
  | 'share_tapped'
  | 'task_completed'
  | 'life_progress_viewed'
  | 'trial_preview_started'
  | 'trial_preview_ended'
  | 'trial_reminder_shown'
  | 'onboarding_paywall_skipped'
  | 'task_added'
  | 'settings_birth_date_saved'
  | 'home_life_locked_tapped'
  | 'goal_created'
  | 'countdown_created'
  | 'countdown_completed'
  | 'share_completed'
  | 'notification_permission_result'
  | 'feature_coach_shown'
  | 'feature_coach_dismissed'
  | 'feature_coach_cta_tapped'
  | 'share_prompt_shown'
  | 'share_prompt_dismissed'
  | 'share_prompt_tapped';

type EventParams = Record<string, string | number | boolean | undefined>;

function sanitizeParams(params?: EventParams): Record<string, string | number> {
  if (!params) return {};
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    if (typeof v === 'boolean') out[k] = v ? 1 : 0;
    else out[k] = v;
  }
  return out;
}

function toPostHogProperties(
  params?: EventParams
): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

function getAnalyticsModule(): {
  logEvent: (name: string, params?: Record<string, string | number>) => Promise<void>;
} | null {
  try {
    const { getApp } = require('@react-native-firebase/app') as {
      getApp: () => unknown;
    };
    const {
      getAnalytics,
      logEvent,
    } = require('@react-native-firebase/analytics') as {
      getAnalytics: (app: unknown) => unknown;
      logEvent: (
        analytics: unknown,
        name: string,
        params?: Record<string, string | number>
      ) => Promise<void>;
    };
    const instance = getAnalytics(getApp());
    return {
      logEvent: (name, params) => logEvent(instance, name, params),
    };
  } catch {
    return null;
  }
}

function getCrashlyticsModule(): {
  recordError: (error: Error) => void;
  log: (message: string) => void;
} | null {
  try {
    const { getApp } = require('@react-native-firebase/app') as {
      getApp: () => unknown;
    };
    const {
      getCrashlytics,
      log,
      recordError,
    } = require('@react-native-firebase/crashlytics') as {
      getCrashlytics: (app: unknown) => unknown;
      log: (crashlytics: unknown, message: string) => void;
      recordError: (crashlytics: unknown, error: Error) => void;
    };
    const instance = getCrashlytics(getApp());
    return {
      log: message => log(instance, message),
      recordError: error => recordError(instance, error),
    };
  } catch {
    return null;
  }
}

async function sendToFirebase(
  name: string,
  payload: Record<string, string | number>
): Promise<void> {
  const analytics = getAnalyticsModule();
  if (!analytics) return;
  try {
    await analytics.logEvent(name, payload);
  } catch {
    /* Firebase not configured */
  }
}

function sendToPostHog(
  name: string,
  params?: EventParams
): void {
  if (!getPostHogClient()) return;
  capturePostHogEvent(name, toPostHogProperties(params));
}

export async function logAnalyticsEvent(
  name: AnalyticsEventName,
  params?: EventParams
): Promise<void> {
  const payload = sanitizeParams(params);
  if (__DEV__) {
    console.log('[analytics]', name, params ?? payload);
  }
  sendToPostHog(name, params);
  await sendToFirebase(name, payload);
}

export async function logAppOpen(): Promise<void> {
  await logAnalyticsEvent('app_open');
}

export function recordCrashError(error: unknown, context?: string): void {
  const err = error instanceof Error ? error : new Error(String(error));
  if (__DEV__) {
    console.warn('[crashlytics]', context ?? 'error', err);
  }
  const crashlytics = getCrashlyticsModule();
  if (!crashlytics) return;
  try {
    if (context) crashlytics.log(context);
    crashlytics.recordError(err);
  } catch {
    //
  }
}
