/**
 * Analytics configuration — PostHog project key and feature flags.
 *
 * Priority: analytics.local.ts (gitignored) → process.env (inlined via babel + .env)
 * See .env.example and analytics.ts.example.
 */

const localOverrides: {
  POSTHOG_API_KEY?: string;
  POSTHOG_HOST?: string;
  POSTHOG_DEV_ENABLED?: boolean;
} = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./analytics.local') as typeof import('./analytics.local');
  } catch {
    return {};
  }
})();

const envKey =
  typeof process !== 'undefined'
    ? (process.env.UNTIL_POSTHOG_API_KEY as string | undefined)?.trim()
    : undefined;

const envHost =
  typeof process !== 'undefined'
    ? (process.env.UNTIL_POSTHOG_HOST as string | undefined)?.trim()
    : undefined;

const envDev =
  typeof process !== 'undefined' && process.env.UNTIL_POSTHOG_DEV === '1';

export const POSTHOG_API_KEY =
  localOverrides.POSTHOG_API_KEY?.trim() || envKey || '';

export const POSTHOG_HOST =
  localOverrides.POSTHOG_HOST?.trim() || envHost || 'https://us.i.posthog.com';

/** When true, PostHog runs in __DEV__ (yarn ios / yarn android). */
export const POSTHOG_DEV_ENABLED =
  localOverrides.POSTHOG_DEV_ENABLED === true || envDev;

export const POSTHOG_ENABLED =
  POSTHOG_API_KEY.length > 0 && (!__DEV__ || POSTHOG_DEV_ENABLED);
