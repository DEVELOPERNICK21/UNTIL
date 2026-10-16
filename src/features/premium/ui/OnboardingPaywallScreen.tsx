/**
 * Hybrid paywall: the RevenueCat paywall first. If the person closes it, they move on: a second
 * paywall straight after would be a second wall. The custom PremiumPaywallBody is the fallback
 * only when the RevenueCat one errors or cannot be shown. Settings → Premium stays custom-only.
 *
 * Nobody is left on a spinner: if the RevenueCat paywall has not appeared after a while, a
 * "Skip for now" appears.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, ScreenGradient } from '../../../shared/ui';
import { PremiumPaywallBody } from './PremiumPaywallBody';
import { useObserveTimeState } from '../../time';
import {
  usePresentRevenueCatPaywall,
} from '../hooks/usePresentRevenueCatPaywall';
import { Spacing, useTheme } from '../../../shared/theme';
import { MONETIZATION_PAYWALL_COPY } from '../../../config/monetization';
import { logAnalyticsEvent } from '../../../shared/analytics/analytics';
import type { AuthStackParamList } from '../../../shared/navigation/types';

/** How long to wait for the RevenueCat paywall before offering a way past the spinner. */
const SPINNER_ESCAPE_AFTER_MS = 10_000;

export function OnboardingPaywallScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const navigation =
    useNavigation<
      NativeStackNavigationProp<AuthStackParamList, 'OnboardingPaywall'>
    >();
  const { timeState } = useObserveTimeState();
  const { present, presenting } = usePresentRevenueCatPaywall();
  const [showCustomPaywall, setShowCustomPaywall] = useState(false);
  const presentedOnce = useRef(false);
  const [canSkipSpinner, setCanSkipSpinner] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setCanSkipSpinner(true), SPINNER_ESCAPE_AFTER_MS);
    return () => clearTimeout(id);
  }, []);

  const lifeProgress =
    typeof timeState.life === 'number' ? timeState.life : undefined;
  const lifePercent = Math.round((lifeProgress ?? 0) * 100);

  const goNext = useCallback(() => {
    navigation.navigate('AccountPrompt');
  }, [navigation]);

  useEffect(() => {
    if (presentedOnce.current) return;
    presentedOnce.current = true;

    void (async () => {
      void logAnalyticsEvent('onboarding_paywall_seen', { deferred: false });
      void logAnalyticsEvent('premium_viewed', { source: 'onboarding_paywall' });
      const result = await present();
      void logAnalyticsEvent('onboarding_paywall_result', { result });
      if (result === 'purchased' || result === 'restored') {
        goNext();
        return;
      }
      if (result === 'cancelled') {
        // They looked and closed it. Let them in.
        void logAnalyticsEvent('onboarding_paywall_skipped', { source: 'revenuecat' });
        goNext();
        return;
      }
      // Error or not shown → our own paywall, so there is still a way to subscribe.
      setShowCustomPaywall(true);
    })();
  }, [present, goNext]);

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <SafeAreaView style={styles.safe} edges={['top']}>
          {presenting && !showCustomPaywall ? (
            <View style={styles.loading}>
              <ActivityIndicator color={theme.textPrimary} />
              {canSkipSpinner ? (
                <TouchableOpacity
                  onPress={() => {
                    void logAnalyticsEvent('onboarding_paywall_skipped', { source: 'spinner' });
                    goNext();
                  }}
                  style={styles.spinnerSkip}
                  activeOpacity={0.7}
                >
                  <Text variant="body" style={{ color: theme.textSecondary }}>
                    Skip for now
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {showCustomPaywall ? (
            <>
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
                  onPurchaseSuccess={goNext}
                  showRestore
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
                    goNext();
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    variant="body"
                    style={{
                      color: theme.textSecondary,
                      textAlign: 'center',
                    }}
                  >
                    Maybe later
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </SafeAreaView>
      </ScreenGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  spinnerSkip: { marginTop: Spacing[4], padding: Spacing[2] },
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
