/**
 * Hybrid paywall: RevenueCat first screen, then custom PremiumPaywallBody.
 * Settings → Premium stays custom-only.
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
import { Text, ScreenGradient } from '../../ui';
import { PremiumPaywallBody } from '../../components/premium/PremiumPaywallBody';
import { useObserveTimeState, usePresentRevenueCatPaywall } from '../../hooks';
import { Spacing, useTheme } from '../../theme';
import { MONETIZATION_PAYWALL_COPY } from '../../config/monetization';
import { logAnalyticsEvent } from '../../services/analytics';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

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
      if (result === 'purchased' || result === 'restored') {
        goNext();
        return;
      }
      // Closed RC paywall, error, or unavailable → show custom second screen
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
