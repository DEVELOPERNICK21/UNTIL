/**
 * usePresentRevenueCatPaywall — first-offer screens (onboarding, deferred, trial).
 * Settings → Premium keeps the custom PremiumPaywallBody.
 *
 * `surface` names the screen for analytics. The SDK's present call only resolves when the
 * paywall closes and offers no "on screen" callback, so `paywall_shown` (and, for a close
 * without buying, `paywall_dismissed`) is logged when it resolves, and only if the paywall
 * really was presented: counts are accurate, the timestamp is the close, not the open.
 */

import { useCallback, useState } from 'react';
import {
  ensurePurchasesConfigured,
  presentRevenueCatPaywallUseCase,
} from '../../../app/di';
import type { PaywallPresentResult } from '../domain/ports/IPaywallPresenter';
import type { AnalyticsPaywallSource } from '../../../shared/analytics/analytics';
import { logPaywallDismissed, logPaywallShown } from '../services/paywallTelemetry';

export function usePresentRevenueCatPaywall(surface: AnalyticsPaywallSource) {
  const [presenting, setPresenting] = useState(false);

  const present = useCallback(
    async (options?: { onlyIfNeeded?: boolean }): Promise<PaywallPresentResult> => {
      setPresenting(true);
      const startedAt = Date.now();
      try {
        ensurePurchasesConfigured();
        const result = await presentRevenueCatPaywallUseCase.execute(options);
        if (result !== 'error' && result !== 'not_presented') {
          logPaywallShown(surface, 'revenuecat');
          if (result === 'cancelled') {
            logPaywallDismissed(surface, 'revenuecat', startedAt, 'close');
          }
        }
        return result;
      } finally {
        setPresenting(false);
      }
    },
    [surface],
  );

  return { present, presenting };
}
