import { useCallback } from 'react';
import {
  logAnalyticsEvent,
  type AnalyticsEventName,
} from '../services/analytics';

type AnalyticsEventParams = Record<string, string | number | boolean | undefined>;

export function useAnalytics(): {
  logEvent: (name: AnalyticsEventName, params?: AnalyticsEventParams) => void;
} {
  const logEvent = useCallback(
    (name: AnalyticsEventName, params?: AnalyticsEventParams) => {
      logAnalyticsEvent(name, params).catch(() => {
        /* Analytics is best-effort. */
      });
    },
    []
  );

  return { logEvent };
}
