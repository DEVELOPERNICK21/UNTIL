import React, { useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';
import { markDeferredPaywallShown } from '../../services/deferredPaywall';
import { logAnalyticsEvent } from '../../services/analytics';
import { recordPaywallDismissed } from '../../services/paywallPrompt';
import { usePresentRevenueCatPaywall } from '../../hooks/usePresentRevenueCatPaywall';
import { navigateToPremium } from '../../navigation/rootNavigationRef';

interface DeferredPaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * First-offer deferred paywall via RevenueCat UI.
 * On purchase success closes. On cancel / error falls through to custom Premium screen.
 *
 * Important: do not wrap RevenueCatUI.presentPaywall in a React Native <Modal>.
 * Native paywall over an RN Modal leaves a touch blocker after dismiss (freeze on Home).
 */
export function DeferredPaywallModal({ visible, onClose }: DeferredPaywallModalProps) {
  const { present } = usePresentRevenueCatPaywall();
  const ranForVisible = useRef(false);

  useEffect(() => {
    if (!visible) {
      ranForVisible.current = false;
      return;
    }
    if (ranForVisible.current) return;
    ranForVisible.current = true;

    void logAnalyticsEvent('deferred_paywall_shown');
    void logAnalyticsEvent('onboarding_paywall_seen', { deferred: true });
    void logAnalyticsEvent('premium_viewed', { source: 'deferred_paywall' });

    void (async () => {
      const result = await present();
      if (result === 'purchased' || result === 'restored') {
        markDeferredPaywallShown();
        onClose();
        return;
      }

      void logAnalyticsEvent('deferred_paywall_dismissed');
      recordPaywallDismissed();
      markDeferredPaywallShown();
      // Clear the engagement trigger before navigating so nothing overlays Home.
      onClose();

      InteractionManager.runAfterInteractions(() => {
        navigateToPremium();
      });
    })();
  }, [visible, present, onClose]);

  return null;
}
