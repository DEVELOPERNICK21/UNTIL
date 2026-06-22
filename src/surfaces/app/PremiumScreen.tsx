/**
 * Premium paywall — shared body from monetization SSOT.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, ScreenGradient } from '../../ui';
import { PremiumPaywallBody } from '../../components/premium/PremiumPaywallBody';
import { Spacing } from '../../theme';
import { useAnalytics } from '../../hooks';

export function PremiumScreen() {
  const { logEvent } = useAnalytics();
  useEffect(() => {
    logEvent('premium_viewed', { source: 'premium_screen' });
  }, [logEvent]);
  if (Platform.OS !== 'android') {
    return (
      <View style={styles.container}>
        <ScreenGradient>
          <ScrollView contentContainerStyle={styles.content}>
            <Text variant="sectionTitle" color="primary" style={styles.title}>
              Premium
            </Text>
            <PremiumPaywallBody showRestore={false} source="premium_screen" />
          </ScrollView>
        </ScreenGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <PremiumPaywallBody source="premium_screen" />
        </ScrollView>
      </ScreenGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[6],
  },
  title: { marginBottom: Spacing[2] },
});
