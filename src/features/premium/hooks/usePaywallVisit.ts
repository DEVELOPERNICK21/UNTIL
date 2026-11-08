/**
 * usePaywallVisit — one visit to the custom paywall: `paywall_shown` when it mounts,
 * `paywall_dismissed` (with seconds open) when it unmounts without a purchase or restore.
 * Call the returned function when the visit ends in a purchase or restore.
 * A subscriber looking at the paywall is logged as shown (is_premium) but never as dismissed.
 */

import { useCallback, useEffect, useRef } from 'react';
import type { AnalyticsPaywallSource } from '../../../shared/analytics/analytics';
import { logPaywallDismissed, logPaywallShown } from '../services/paywallTelemetry';

export function usePaywallVisit(
  surface: AnalyticsPaywallSource,
  isPremium: boolean,
): () => void {
  const converted = useRef(false);
  const premiumAtOpen = useRef(isPremium);

  useEffect(() => {
    const openedAt = Date.now();
    const wasPremium = premiumAtOpen.current;
    logPaywallShown(surface, 'custom', wasPremium);
    return () => {
      if (!converted.current && !wasPremium) {
        logPaywallDismissed(surface, 'custom', openedAt, 'leave');
      }
    };
  }, [surface]);

  return useCallback(() => {
    converted.current = true;
  }, []);
}
