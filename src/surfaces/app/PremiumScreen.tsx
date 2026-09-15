/**
 * Premium paywall — shared body from monetization SSOT.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ScreenGradient } from '../../ui';
import { PremiumPaywallBody } from '../../components/premium/PremiumPaywallBody';
import { Spacing } from '../../theme';
import { useAnalytics } from '../../hooks';

export function PremiumScreen() {
  const { logEvent } = useAnalytics();
  useEffect(() => {
    logEvent('premium_viewed', { source: 'premium_screen' });
  }, [logEvent]);

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
});
