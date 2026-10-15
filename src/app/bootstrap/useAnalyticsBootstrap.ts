/**
 * PostHog identify + person properties on app launch and access changes.
 */

import { useEffect, useRef } from 'react';
import { getDeviceId } from '../../shared/platform/device/DeviceId';
import { getAccessStateUseCase, observeSubscriptionUseCase } from '../di';
import {
  identifyPostHogUser,
  setPostHogPersonProperties,
} from '../../shared/analytics/posthogClient';
import { syncAnalyticsUserProperties } from '../../shared/analytics/analyticsUserProperties';
import {
  logAnalyticsEvent,
  setCrashAttributes,
  setCrashUserId,
} from '../../shared/analytics/analytics';
import { useOnboardingState } from '../../features/onboarding';
import { useAuthSession } from '../../features/account';

let appVersionPromise: Promise<string | undefined> | null = null;

function loadAppVersion(): Promise<string | undefined> {
  if (!appVersionPromise) {
    appVersionPromise = (async () => {
      try {
        const DeviceInfo = require('react-native-device-info').default;
        const version = await DeviceInfo?.getVersion?.();
        return typeof version === 'string' ? version : undefined;
      } catch {
        return undefined;
      }
    })();
  }
  return appVersionPromise;
}

export function useAnalyticsBootstrap(): void {
  const { hasCompleted } = useOnboardingState();
  const { uid } = useAuthSession();
  const wasTrialActiveRef = useRef<boolean | null>(null);
  const identifiedAsRef = useRef<string | null>(null);

  useEffect(() => {
    void (async () => {
      const deviceId = await getDeviceId();
      const distinctId = uid ?? deviceId;
      // Re-runs when uid changes (sign-in/out), not on every render.
      if (identifiedAsRef.current === distinctId) return;
      identifiedAsRef.current = distinctId;

      identifyPostHogUser(distinctId);
      setCrashUserId(distinctId);
      if (uid) {
        // Signed in: identity is the account uid, device id kept as a property.
        setPostHogPersonProperties({ device_id: deviceId });
        setCrashAttributes({ device_id: deviceId });
      }

      const access = getAccessStateUseCase.execute();
      const appVersion = await loadAppVersion();
      syncAnalyticsUserProperties({
        access,
        onboardingComplete: hasCompleted,
        appVersion,
      });
      wasTrialActiveRef.current = access.trialActive;
    })();
  }, [hasCompleted, uid]);

  useEffect(() => {
    const refresh = () => {
      const access = getAccessStateUseCase.execute();
      void loadAppVersion().then(appVersion => {
        syncAnalyticsUserProperties({
          access,
          onboardingComplete: hasCompleted,
          appVersion,
        });
      });

      if (
        wasTrialActiveRef.current === true &&
        !access.trialActive &&
        !access.isPremium
      ) {
        void logAnalyticsEvent('trial_preview_ended', { converted: 0 });
      }
      wasTrialActiveRef.current = access.trialActive;
    };

    refresh();
    return observeSubscriptionUseCase.subscribe(refresh);
  }, [hasCompleted]);
}
