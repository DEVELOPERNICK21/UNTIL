/**
 * Premium / paywall — Android Play Billing (monthly, yearly, lifetime) + restore.
 * Simple layout; store prices load when available, with static INR fallback labels.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ErrorCode } from 'react-native-iap';
import { Text, ScreenGradient, Card } from '../../ui';
import { usePurchase } from '../../hooks/usePurchase';
import { useObserveSubscription } from '../../hooks/useObserveSubscription';
import { useAccessControl } from '../../hooks/useAccessControl';
import { Spacing, Typography, useTheme } from '../../theme';
function priceLabel(
  products: Array<{ productId: string; price: string }>,
  productId: string,
  fallback: string
): string {
  const p = products.find(x => x.productId === productId);
  return p?.price ?? fallback;
}

export function PremiumScreen() {
  const theme = useTheme();
  const { isPremium } = useObserveSubscription();
  const { access } = useAccessControl();
  const {
    products,
    loading,
    getProducts,
    requestPurchase,
    restorePurchases,
    productIds,
  } = usePurchase();
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android') {
      void getProducts().catch(() => {
        /* ignore; user can retry via purchase attempt */
      });
    }
  }, [getProducts]);

  const monthlyPrice = useMemo(
    () => priceLabel(products, productIds.monthly, '₹99'),
    [products, productIds.monthly]
  );
  const yearlyPrice = useMemo(
    () => priceLabel(products, productIds.yearly, '₹499'),
    [products, productIds.yearly]
  );
  const lifetimePrice = useMemo(
    () => priceLabel(products, productIds.lifetime, '₹999'),
    [products, productIds.lifetime]
  );

  const onBuy = useCallback(
    async (productId: string) => {
      if (Platform.OS !== 'android') {
        Alert.alert('Premium', 'In-app purchases are available on Android.');
        return;
      }
      try {
        await requestPurchase(productId);
      } catch (e: unknown) {
        const err = e as { code?: string; message?: string };
        if (err?.code === ErrorCode.UserCancelled) {
          return;
        }
        Alert.alert(
          'Purchase failed',
          err?.message ?? 'Something went wrong. Check your connection and try again.'
        );
      }
    },
    [requestPurchase]
  );

  const onRestore = useCallback(async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Restore', 'Restore is available on Android.');
      return;
    }
    setRestoring(true);
    try {
      const { restored } = await restorePurchases();
      Alert.alert(
        restored ? 'Restored' : 'Nothing to restore',
        restored
          ? 'Your purchases have been restored.'
          : 'No active purchases found for this account.'
      );
    } catch (e: unknown) {
      const err = e as { message?: string };
      Alert.alert('Restore failed', err?.message ?? 'Try again later.');
    } finally {
      setRestoring(false);
    }
  }, [restorePurchases]);

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.container}>
        <ScreenGradient>
          <ScrollView contentContainerStyle={styles.content}>
            <Text variant="sectionTitle" color="primary" style={styles.title}>
              Premium
            </Text>
            <Text variant="body" color="secondary">
              Unlock Premium is available on Android via Google Play. On this device you can keep
              using the free core experience.
            </Text>
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
          <Text variant="sectionTitle" color="primary" style={styles.title}>
            Unlock Premium
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Month widget, Life, floating overlay, Dynamic Island, and future customization. Core day,
            year, and Share stay free. Includes a 14-day trial from first open.
          </Text>

          {isPremium && (
            <Card style={{ ...styles.statusCard, borderColor: theme.divider }}>
              <Text variant="body" color="primary">
                You have Premium active.
              </Text>
            </Card>
          )}

          {!isPremium && access.trialActive && (
            <Card
              style={{ ...styles.statusCard, borderColor: theme.percent }}
            >
              <Text variant="body" color="primary">
                Trial active (14 days). Premium features are unlocked for this period.
              </Text>
            </Card>
          )}

          {loading && (
            <ActivityIndicator color={theme.textPrimary} style={styles.loader} />
          )}

          <TouchableOpacity
            style={[styles.cta, styles.ctaSecondary, { borderColor: theme.divider }]}
            onPress={() => onBuy(productIds.monthly)}
            activeOpacity={0.8}
          >
            <View style={styles.ctaRow}>
              <Text variant="title" color="primary">
                Monthly
              </Text>
              <Text variant="body" color="secondary">
                {monthlyPrice}
              </Text>
            </View>
            <Text variant="caption" color="secondary">
              Billed every month
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cta, styles.ctaHighlight, { borderColor: theme.percent }]}
            onPress={() => onBuy(productIds.yearly)}
            activeOpacity={0.8}
          >
            <View style={[styles.badge, { backgroundColor: theme.percent }]}>
              <Text variant="caption" style={styles.badgeText}>
                Best value
              </Text>
            </View>
            <View style={styles.ctaRow}>
              <Text variant="title" color="primary">
                Yearly
              </Text>
              <Text variant="body" color="primary">
                {yearlyPrice}
              </Text>
            </View>
            <Text variant="caption" color="secondary">
              Billed once per year
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cta, styles.ctaHighlight, { borderColor: theme.percent }]}
            onPress={() => onBuy(productIds.lifetime)}
            activeOpacity={0.8}
          >
            <View style={[styles.badge, { backgroundColor: theme.percent }]}>
              <Text variant="caption" style={styles.badgeText}>
                One-time
              </Text>
            </View>
            <View style={styles.ctaRow}>
              <Text variant="title" color="primary">
                Lifetime
              </Text>
              <Text variant="body" color="primary">
                {lifetimePrice}
              </Text>
            </View>
            <Text variant="caption" color="secondary">
              Pay once, keep Premium on this account
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.restoreBtn, { borderColor: theme.divider }]}
            onPress={() => void onRestore()}
            disabled={restoring}
            activeOpacity={0.7}
          >
            {restoring ? (
              <ActivityIndicator color={theme.textPrimary} />
            ) : (
              <Text variant="body" color="primary">
                Restore purchase
              </Text>
            )}
          </TouchableOpacity>

          <Text variant="caption" color="secondary" style={styles.legal}>
            Purchases are validated on-device for now; account/server verification can be added later
            using your purchase token.
          </Text>
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
  subtitle: { marginBottom: Spacing[4] },
  statusCard: {
    padding: Spacing[3],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderRadius: 12,
  },
  loader: { marginVertical: Spacing[2] },
  cta: {
    padding: Spacing[4],
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: Spacing[3],
  },
  ctaSecondary: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  ctaHighlight: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  ctaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[1],
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: Spacing[2],
  },
  badgeText: { color: '#000', fontSize: Typography.micro },
  restoreBtn: {
    paddingVertical: Spacing[3],
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: Spacing[2],
  },
  legal: { marginTop: Spacing[4], lineHeight: 18 },
});
