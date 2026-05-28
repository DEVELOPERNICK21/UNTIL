/**
 * Product analytics — Firebase when native modules + google-services are configured.
 * Safe no-op when unavailable (local dev without Firebase).
 */

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
  | 'retention_notification_enabled';

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

export async function logAnalyticsEvent(
  name: AnalyticsEventName,
  params?: EventParams
): Promise<void> {
  const payload = sanitizeParams(params);
  if (__DEV__) {
    console.log('[analytics]', name, payload);
  }
  const analytics = getAnalyticsModule();
  if (!analytics) return;
  try {
    await analytics.logEvent(name, payload);
  } catch {
    /* Firebase not configured */
  }
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
