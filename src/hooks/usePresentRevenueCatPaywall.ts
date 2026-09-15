/**
 * usePresentRevenueCatPaywall — first-offer screens (onboarding, deferred, trial).
 * Settings → Premium keeps the custom PremiumPaywallBody.
 */

import { useCallback, useState } from 'react';
import {
  ensurePurchasesConfigured,
  presentRevenueCatPaywallUseCase,
} from '../di';
import type { PaywallPresentResult } from '../domain/repository/IPaywallPresenter';

export function usePresentRevenueCatPaywall() {
  const [presenting, setPresenting] = useState(false);

  const present = useCallback(
    async (options?: { onlyIfNeeded?: boolean }): Promise<PaywallPresentResult> => {
      setPresenting(true);
      try {
        ensurePurchasesConfigured();
        return await presentRevenueCatPaywallUseCase.execute(options);
      } finally {
        setPresenting(false);
      }
    },
    [],
  );

  return { present, presenting };
}
