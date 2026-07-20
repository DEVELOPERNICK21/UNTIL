/**
 * PostHog identify + person properties on app launch and access changes.
 */

import { useEffect, useRef } from 'react';
import { getDeviceId } from '../infrastructure/DeviceId';
import { getAccessStateUseCase, observeSubscriptionUseCase } from '../di';
import { identifyPostHogUser } from '../services/posthogClient';
import { syncAnalyticsUserProperties } from '../services/analyticsUserProperties';
import { logAnalyticsEvent, setCrashUserId } from '../services/analytics';
import { useOnboardingState } from './useOnboardingState';

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
  const identifiedRef = useRef(false);
  const wasTrialActiveRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (identifiedRef.current) return;
    identifiedRef.current = true;
    void (async () => {
      const deviceId = await getDeviceId();
      identifyPostHogUser(deviceId);
      setCrashUserId(deviceId);
      const access = getAccessStateUseCase.execute();
      const appVersion = await loadAppVersion();
      syncAnalyticsUserProperties({
        access,
        onboardingComplete: hasCompleted,
        appVersion,
      });
      wasTrialActiveRef.current = access.trialActive;
    })();
  }, [hasCompleted]);

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
