import React, { useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, ScreenGradient } from '../../ui';
import { PremiumPaywallBody } from '../premium/PremiumPaywallBody';
import { Spacing, useTheme } from '../../theme';
import { MONETIZATION_PAYWALL_COPY } from '../../config/monetization';
import { markDeferredPaywallShown } from '../../services/deferredPaywall';
import { logAnalyticsEvent } from '../../services/analytics';
import { recordPaywallDismissed } from '../../services/paywallPrompt';

interface DeferredPaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DeferredPaywallModal({ visible, onClose }: DeferredPaywallModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  useEffect(() => {
    if (visible) {
      void logAnalyticsEvent('deferred_paywall_shown');
      void logAnalyticsEvent('onboarding_paywall_seen', { deferred: true });
    }
  }, [visible]);

  if (!visible) return null;

  const handleDismiss = () => {
    void logAnalyticsEvent('deferred_paywall_dismissed');
    recordPaywallDismissed();
    markDeferredPaywallShown();
    onClose();
  };

  return (
    <Modal visible animationType="slide" statusBarTranslucent>
      <View style={[styles.container, { minHeight: height }]}>
        <ScreenGradient>
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              {
                paddingTop: insets.top + Spacing[3],
                paddingBottom: insets.bottom + Spacing[6],
              },
            ]}
          >
            <TouchableOpacity onPress={handleDismiss} style={styles.skipWrap}>
              <Text variant="body" color="secondary">
                Not now
              </Text>
            </TouchableOpacity>
            <PremiumPaywallBody
              headline={MONETIZATION_PAYWALL_COPY.onboardingPaywallTitle}
              subheadline={MONETIZATION_PAYWALL_COPY.onboardingPaywallSub}
              onPurchaseSuccess={() => {
                markDeferredPaywallShown();
                onClose();
              }}
            />
          </ScrollView>
        </ScreenGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing[4] },
  skipWrap: { alignSelf: 'flex-end', marginBottom: Spacing[2] },
});
