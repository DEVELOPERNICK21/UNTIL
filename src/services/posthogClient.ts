/**
 * Shared PostHog client — used by PostHogProvider and analytics dual-write.
 */

import PostHog from 'posthog-react-native';
import {
  POSTHOG_API_KEY,
  POSTHOG_ENABLED,
  POSTHOG_HOST,
} from '../config/analytics';

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
      enableSessionReplay: false,
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

export async function identifyPostHogUser(distinctId: string): Promise<void> {
  const client = getPostHogClient();
  if (!client) return;
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
  if (!client) return;
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
  if (!client) return;
  try {
    client.capture(name, properties);
  } catch {
    /* best-effort */
  }
}
