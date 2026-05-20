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
import { Spacing, Radius, useTheme } from '../../theme';
import { MONETIZATION_PAYWALL_COPY } from '../../config/monetization';

export function OnboardingPaywallScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const completeAuth = useOnboardingComplete();
  const { timeState } = useObserveTimeState();

  const lifePercent = Math.round((timeState.life ?? 0) * 100);
  const subheadline = `${MONETIZATION_PAYWALL_COPY.onboardingPaywallSub}\n\nYou have lived about ${lifePercent}% of your expected life.`;

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
              subheadline={subheadline}
              onPurchaseSuccess={completeAuth}
              showRestore={false}
            />
          </ScrollView>
          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, Spacing[3]) },
            ]}
          >
            <TouchableOpacity onPress={completeAuth} activeOpacity={0.7}>
              <Text variant="body" style={{ color: theme.textSecondary, textAlign: 'center' }}>
                Continue with free Day & Year →
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
