/**
 * useAnalyticsConsent — the user's stored, revocable usage-analytics choice.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  isAnalyticsAllowed,
  isKnownUnderMinimumAge,
  setAnalyticsConsent,
  subscribeAnalyticsConsent,
} from '../services/analyticsConsent';

export function useAnalyticsConsent() {
  const [enabled, setEnabled] = useState(isAnalyticsAllowed);
  const [locked, setLocked] = useState(isKnownUnderMinimumAge);

  useEffect(
    () =>
      subscribeAnalyticsConsent(() => {
        setEnabled(isAnalyticsAllowed());
        setLocked(isKnownUnderMinimumAge());
      }),
    []
  );

  const setAnalyticsEnabled = useCallback((next: boolean) => {
    setAnalyticsConsent(next ? 'granted' : 'denied');
  }, []);

  return { analyticsEnabled: enabled, analyticsLocked: locked, setAnalyticsEnabled };
}
