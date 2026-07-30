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
  | 'onboarding_step_view'
  | 'onboarding_answer'
  | 'onboarding_life_aha'
  | 'onboarding_results_view'
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
  | 'share_prompt_tapped'
  | 'post_share_upgrade_prompt_shown'
  | 'post_share_upgrade_prompt_tapped'
  | 'post_share_upgrade_prompt_dismissed'
  | 'intervention_teaser_tap'
  | 'intervention_start_tracking'
  | 'intervention_stop_tracking'
  | 'intervention_quick_log'
  | 'intervention_limit_changed'
  | 'student_verify_shown'
  | 'student_verify_succeeded'
  | 'student_verify_failed'
  | 'review_requested'
  | 'review_store_fallback'
  | 'account_prompt_shown'
  | 'account_prompt_google_tapped'
  | 'account_prompt_signin_succeeded'
  | 'account_prompt_signin_failed'
  | 'account_prompt_skip_tapped'
  | 'account_prompt_skip_confirmed'
  | 'account_prompt_skip_cancelled';

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
    const { getApp, getApps } = require('@react-native-firebase/app') as {
      getApp: () => unknown;
      getApps: () => unknown[];
    };
    if (getApps().length === 0) return null;
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
  setUserId: (userId: string) => Promise<void>;
  setAttributes: (attributes: Record<string, string>) => Promise<void>;
  setCrashlyticsCollectionEnabled: (enabled: boolean) => Promise<void>;
} | null {
  try {
    const { getApp, getApps } = require('@react-native-firebase/app') as {
      getApp: () => unknown;
      getApps: () => unknown[];
    };
    // Namespaced crashlytics index calls getApp() at import time; skip if
    // native FIRApp was never configured (e.g. missing configure() / plist).
    if (getApps().length === 0) return null;
    const {
      getCrashlytics,
      log,
      recordError,
      setUserId,
      setAttributes,
      setCrashlyticsCollectionEnabled,
    } = require('@react-native-firebase/crashlytics') as {
      getCrashlytics: (app: unknown) => unknown;
      log: (crashlytics: unknown, message: string) => void;
      recordError: (crashlytics: unknown, error: Error) => void;
      setUserId: (crashlytics: unknown, userId: string) => Promise<null>;
      setAttributes: (
        crashlytics: unknown,
        attributes: Record<string, string>
      ) => Promise<null>;
      setCrashlyticsCollectionEnabled: (
        crashlytics: unknown,
        enabled: boolean
      ) => Promise<null>;
    };
    const instance = getCrashlytics(getApp());
    return {
      log: message => log(instance, message),
      recordError: error => recordError(instance, error),
      setUserId: userId => setUserId(instance, userId).then(() => undefined),
      setAttributes: attributes =>
        setAttributes(instance, attributes).then(() => undefined),
      setCrashlyticsCollectionEnabled: enabled =>
        setCrashlyticsCollectionEnabled(instance, enabled).then(
          () => undefined
        ),
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

/** Breadcrumb line attached to subsequent Crashlytics reports. */
export function logCrashBreadcrumb(message: string): void {
  if (!message.trim()) return;
  if (__DEV__) {
    console.log('[crashlytics:breadcrumb]', message);
  }
  const crashlytics = getCrashlyticsModule();
  if (!crashlytics) return;
  try {
    crashlytics.log(message);
  } catch {
    //
  }
}

/** Anonymous device / install id for Crashlytics console grouping. */
export function setCrashUserId(userId: string): void {
  const id = userId.trim();
  if (!id) return;
  const crashlytics = getCrashlyticsModule();
  if (!crashlytics) return;
  void crashlytics.setUserId(id).catch(() => {});
}

/** String attributes visible on Crashlytics issues (values coerced to string). */
export function setCrashAttributes(
  attributes: Record<string, string | number | boolean | undefined>
): void {
  const crashlytics = getCrashlyticsModule();
  if (!crashlytics) return;
  const payload: Record<string, string> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined) continue;
    payload[key] = String(value);
  }
  if (Object.keys(payload).length === 0) return;
  void crashlytics.setAttributes(payload).catch(() => {});
}

/**
 * Enable Crashlytics collection in release; keep quiet in local __DEV__
 * unless explicitly forced.
 */
export function initCrashlyticsCollection(forceEnabled = false): void {
  const crashlytics = getCrashlyticsModule();
  if (!crashlytics) return;
  const enabled = forceEnabled || !__DEV__;
  void crashlytics.setCrashlyticsCollectionEnabled(enabled).catch(() => {});
}
