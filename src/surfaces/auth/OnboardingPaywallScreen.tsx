/**
 * Post–life-preview paywall (audit: birth date → life % → offer).
 */

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Text, ScreenGradient } from '../../ui';
import { PremiumPaywallBody } from '../../components/premium/PremiumPaywallBody';
import { useObserveTimeState } from '../../hooks';
import { useOnboardingComplete } from '../onboarding';
import { Spacing, useTheme } from '../../theme';
import { MONETIZATION_PAYWALL_COPY } from '../../config/monetization';
import { logAnalyticsEvent } from '../../services/analytics';

export function OnboardingPaywallScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const completeAuth = useOnboardingComplete();
  const { timeState } = useObserveTimeState();

  const lifeProgress =
    typeof timeState.life === 'number' ? timeState.life : undefined;
  const lifePercent = Math.round((lifeProgress ?? 0) * 100);

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { paddingBottom: Math.max(insets.bottom, Spacing[4]) + 80 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <PremiumPaywallBody
              headline={MONETIZATION_PAYWALL_COPY.onboardingPaywallTitle}
              subheadline={MONETIZATION_PAYWALL_COPY.onboardingPaywallSub}
              lifeProgress={lifeProgress}
              onPurchaseSuccess={() =>
                completeAuth({
                  exit_type: 'completed',
                  step: 11,
                  step_name: 'paywall_purchase',
                })
              }
              showRestore={false}
              source="onboarding_paywall"
            />
          </ScrollView>
          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, Spacing[3]) },
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                void logAnalyticsEvent('onboarding_paywall_skipped', {
                  life_percent: lifePercent,
                });
                completeAuth({
                  exit_type: 'skipped',
                  step: 11,
                  step_name: 'paywall_maybe_later',
                });
              }}
              activeOpacity={0.7}
            >
              <Text variant="body" style={{ color: theme.textSecondary, textAlign: 'center' }}>
                Maybe later
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ScreenGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[2],
  },
});
