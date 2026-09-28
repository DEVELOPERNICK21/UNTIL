/**
 * Shared PostHog client — used by PostHogProvider and analytics dual-write.
 * Events only: session replay stays off (config/analytics.ts SESSION_REPLAY_ENABLED).
 */

import PostHog from 'posthog-react-native';
import {
  POSTHOG_API_KEY,
  POSTHOG_ENABLED,
  POSTHOG_HOST,
} from '../config/analytics';
import { canStartSessionReplay, isAnalyticsAllowed } from './analyticsConsent';

let sharedClient: PostHog | null = null;

export function initPostHogClient(): PostHog | null {
  if (!POSTHOG_ENABLED || !POSTHOG_API_KEY) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(
        '[PostHog] disabled — set UNTIL_POSTHOG_API_KEY in .env (and UNTIL_POSTHOG_DEV=1) or fill src/config/analytics.local.ts. See .env.example.'
      );
    }
    return null;
  }
  if (!sharedClient) {
    sharedClient = new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
      captureAppLifecycleEvents: true,
      defaultOptIn: isAnalyticsAllowed(),
      enableSessionReplay: canStartSessionReplay(),
      ...(canStartSessionReplay()
        ? {
            sessionReplayConfig: {
              maskAllTextInputs: true,
              maskAllImages: true,
              captureLog: false,
              captureNetworkTelemetry: false,
            },
          }
        : {}),
    });
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[PostHog] enabled → ${POSTHOG_HOST}`);
    }
  }
  return sharedClient;
}

export function getPostHogClient(): PostHog | null {
  return sharedClient;
}

/** Applies the stored analytics choice to the live client. */
export async function applyPostHogConsent(allowed: boolean): Promise<void> {
  const client = getPostHogClient();
  if (!client) return;
  try {
    if (allowed) {
      await client.optIn();
    } else {
      await client.optOut();
      client.reset();
    }
  } catch {
    /* best-effort */
  }
}

export async function identifyPostHogUser(distinctId: string): Promise<void> {
  const client = getPostHogClient();
  if (!client || !isAnalyticsAllowed()) return;
  try {
    client.identify(distinctId);
  } catch {
    /* best-effort */
  }
}

export function setPostHogPersonProperties(
  properties: Record<string, string | number | boolean>
): void {
  const client = getPostHogClient();
  if (!client || !isAnalyticsAllowed()) return;
  try {
    client.identify(undefined, { $set: properties });
  } catch {
    /* best-effort */
  }
}

export function capturePostHogEvent(
  name: string,
  properties?: Record<string, string | number | boolean>
): void {
  const client = getPostHogClient();
  if (!client || !isAnalyticsAllowed()) return;
  try {
    client.capture(name, properties);
  } catch {
    /* best-effort */
  }
}
