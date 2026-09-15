import React, { useEffect, useRef } from 'react';
import { Modal, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenGradient } from '../../ui';
import { Spacing, useTheme } from '../../theme';
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
 */
export function DeferredPaywallModal({ visible, onClose }: DeferredPaywallModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { present, presenting } = usePresentRevenueCatPaywall();
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
      onClose();
      // After RC first screen, open custom main paywall
      navigateToPremium();
    })();
  }, [visible, present, onClose]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View
        style={[
          styles.backdrop,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <ScreenGradient>
          <View style={styles.center}>
            {presenting ? (
              <ActivityIndicator color={theme.textPrimary} />
            ) : null}
          </View>
        </ScreenGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[4],
  },
});
