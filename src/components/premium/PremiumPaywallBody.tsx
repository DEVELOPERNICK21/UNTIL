/**
 * Shared paywall body — Premium screen + onboarding offer.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { ErrorCode } from 'react-native-iap';
import { Text, Card } from '../../ui';
import { usePurchase } from '../../hooks/usePurchase';
import { useObserveSubscription } from '../../hooks/useObserveSubscription';
import { useAccessControl } from '../../hooks/useAccessControl';
import { Spacing, Typography, useTheme } from '../../theme';
import {
  FALLBACK_LIFETIME_PRICE,
  FALLBACK_MONTHLY_PRICE,
  FALLBACK_STUDENT_YEARLY_PRICE,
  FALLBACK_YEARLY_PRICE,
  MONETIZATION_FEATURE_FLAGS,
  MONETIZATION_PAYWALL_COPY,
  MONETIZATION_PRICING,
  PAYWALL_TRUST_SIGNALS,
  PREMIUM_BENEFITS,
  LEGAL_URLS,
  buildSubscriptionDisclosure,
  formatPreviewActiveBody,
} from '../../config/monetization';
import {
  logAnalyticsEvent,
  type AnalyticsPaywallSource,
} from '../../services/analytics';
import {
  clearPendingPurchase,
  setPendingPurchase,
  setPurchaseSuccessListener,
} from '../../services/purchaseAnalyticsContext';

function priceLabel(
  products: Array<{ productId: string; price: string }>,
  productId: string,
  fallback: string
): string {
  const p = products.find(x => x.productId === productId);
  return p?.price ?? fallback;
}

export interface PremiumPaywallBodyProps {
  headline?: string;
  subheadline?: string;
  onPurchaseSuccess?: () => void;
  showRestore?: boolean;
  source?: AnalyticsPaywallSource;
}

export function PremiumPaywallBody({
  headline = MONETIZATION_PAYWALL_COPY.headline,
  subheadline = MONETIZATION_PAYWALL_COPY.subheadline,
  onPurchaseSuccess,
  showRestore = true,
  source = 'unknown',
}: PremiumPaywallBodyProps) {
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
      void getProducts().catch(() => {});
    }
  }, [getProducts]);

  useEffect(() => {
    setPurchaseSuccessListener(() => {
      onPurchaseSuccess?.();
    });
    return () => setPurchaseSuccessListener(null);
  }, [onPurchaseSuccess]);

  const yearlyPrice = useMemo(
    () => priceLabel(products, productIds.yearly, FALLBACK_YEARLY_PRICE),
    [products, productIds.yearly]
  );
  const monthlyPrice = useMemo(
    () => priceLabel(products, productIds.monthly, FALLBACK_MONTHLY_PRICE),
    [products, productIds.monthly]
  );
  const lifetimePrice = useMemo(
    () => priceLabel(products, productIds.lifetime, FALLBACK_LIFETIME_PRICE),
    [products, productIds.lifetime]
  );
  const studentPrice = useMemo(
    () =>
      priceLabel(
        products,
        productIds.yearlyStudent ?? 'yearly_subscription_student',
        FALLBACK_STUDENT_YEARLY_PRICE
      ),
    [products, productIds]
  );

  const yearlyCtaSub = useMemo(
    () =>
      !isPremium && access.trialActive
        ? MONETIZATION_PAYWALL_COPY.yearlyCtaSubDuringPreview
        : MONETIZATION_PAYWALL_COPY.yearlyCtaSub,
    [isPremium, access.trialActive]
  );

  const subscriptionDisclosure = useMemo(
    () =>
      buildSubscriptionDisclosure({
        yearlyPrice,
        monthlyPrice,
        lifetimePrice,
        trialActive: !isPremium && access.trialActive,
        trialEndsAtMs: access.trialEndsAt,
      }),
    [
      yearlyPrice,
      monthlyPrice,
      lifetimePrice,
      isPremium,
      access.trialActive,
      access.trialEndsAt,
    ]
  );

  const openLegalUrl = useCallback((url: string) => {
    void Linking.openURL(url).catch(() => {
      Alert.alert('Could not open link', url);
    });
  }, []);

  const onBuy = useCallback(
    async (productId: string) => {
      if (Platform.OS !== 'android') {
        Alert.alert('Premium', 'Purchases are available on Android.');
        return;
      }
      const priceDisplay = priceLabel(products, productId, '');
      setPendingPurchase({
        plan_id: productId,
        source,
        price_display: priceDisplay,
      });
      void logAnalyticsEvent('premium_purchase_started', {
        plan_id: productId,
        source,
        price_display: priceDisplay,
      });
      try {
        await requestPurchase(productId);
      } catch (e: unknown) {
        const err = e as { code?: string; message?: string };
        if (err?.code === ErrorCode.UserCancelled) {
          clearPendingPurchase();
          void logAnalyticsEvent('premium_purchase_cancelled', {
            plan_id: productId,
            source,
          });
          return;
        }
        clearPendingPurchase();
        void logAnalyticsEvent('premium_purchase_failed', {
          plan_id: productId,
          source,
          price_display: priceDisplay,
          error_code: err?.code ?? 'unknown',
          error_message: err?.message ?? 'Unknown error',
          payment_provider: 'google_play',
        });
        Alert.alert(
          'Purchase failed',
          err?.message ?? 'Something went wrong. Check your connection and try again.'
        );
      }
    },
    [requestPurchase, products, source]
  );

  const onRestore = useCallback(async () => {
    setRestoring(true);
    try {
      const { restored } = await restorePurchases();
      Alert.alert(
        restored ? 'Restored' : 'Nothing to restore',
        restored
          ? 'Your purchase has been restored.'
          : 'No active purchase found for this Google account.'
      );
      if (restored) {
        void logAnalyticsEvent('premium_restore_completed', { source });
        onPurchaseSuccess?.();
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      Alert.alert('Restore failed', err?.message ?? 'Try again later.');
    } finally {
      setRestoring(false);
    }
  }, [restorePurchases, onPurchaseSuccess, source]);

  if (Platform.OS !== 'android') {
    return (
      <Text variant="body" color="secondary">
        Premium purchases are available on Android via Google Play.
      </Text>
    );
  }

  return (
    <View>
      <Text variant="sectionTitle" color="primary" style={styles.headline}>
        {headline}
      </Text>
      <Text variant="body" color="secondary" style={styles.subtitle}>
        {subheadline}
      </Text>

      {isPremium && (
        <Card style={{ ...styles.statusCard, borderColor: theme.divider }}>
          <Text variant="body" color="primary">
            You have Premium active.
          </Text>
        </Card>
      )}

      {!isPremium && access.trialActive && (
        <Card style={{ ...styles.statusCard, borderColor: theme.percent }}>
          <Text variant="body" color="primary" style={styles.previewTitle}>
            {MONETIZATION_PAYWALL_COPY.previewActiveTitle}
          </Text>
          <Text variant="caption" color="secondary" style={styles.previewBody}>
            {formatPreviewActiveBody(access.trialEndsAt)}
          </Text>
        </Card>
      )}

      <View style={styles.benefitsBlock}>
        <Text variant="caption" color="secondary" style={styles.benefitsHeading}>
          PREMIUM INCLUDES
        </Text>
        {PREMIUM_BENEFITS.map(line => (
          <View key={line} style={styles.benefitRow}>
            <Text variant="body" color="primary" style={styles.benefitBullet}>
              ✓
            </Text>
            <Text variant="body" color="secondary" style={styles.benefitText}>
              {line}
            </Text>
          </View>
        ))}
      </View>

      <Card style={{ ...styles.disclosureCard, borderColor: theme.divider }}>
        <Text variant="caption" color="secondary" style={styles.benefitsHeading}>
          {MONETIZATION_PAYWALL_COPY.subscriptionDisclosureTitle.toUpperCase()}
        </Text>
        {subscriptionDisclosure.map(line => (
          <Text
            key={line}
            variant="caption"
            color="secondary"
            style={styles.disclosureLine}
          >
            · {line}
          </Text>
        ))}
      </Card>

      {loading && <ActivityIndicator color={theme.textPrimary} style={styles.loader} />}

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
        <Text variant="title" color="primary" style={styles.ctaTitle}>
          {MONETIZATION_PAYWALL_COPY.yearlyCta}
        </Text>
        <Text variant="body" color="primary">
          {yearlyPrice}/year
        </Text>
        <Text variant="caption" color="secondary" style={styles.ctaMeta}>
          Less than {MONETIZATION_PRICING.yearlyPerDayDisplay}/day · Save{' '}
          {MONETIZATION_PRICING.yearlySavingsVsMonthlyDisplay}/year vs monthly
        </Text>
        <Text variant="caption" color="secondary" style={styles.ctaMeta}>
          {yearlyCtaSub}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.cta, styles.ctaSecondary, { borderColor: theme.divider }]}
        onPress={() => onBuy(productIds.monthly)}
        activeOpacity={0.8}
      >
        <Text variant="title" color="primary">
          {MONETIZATION_PAYWALL_COPY.monthlyCta}
        </Text>
        <Text variant="body" color="secondary">
          {monthlyPrice}/month
        </Text>
        <Text variant="caption" color="secondary">
          {MONETIZATION_PAYWALL_COPY.monthlySub}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.cta, styles.ctaSecondary, { borderColor: theme.divider }]}
        onPress={() => onBuy(productIds.lifetime)}
        activeOpacity={0.8}
      >
        <Text variant="title" color="primary">
          {MONETIZATION_PAYWALL_COPY.lifetimeCta}
        </Text>
        <Text variant="body" color="secondary">
          {lifetimePrice} once
        </Text>
        <Text variant="caption" color="secondary">
          {MONETIZATION_PAYWALL_COPY.lifetimeSub}
        </Text>
      </TouchableOpacity>

      {MONETIZATION_FEATURE_FLAGS.studentPlanEnabled && productIds.yearlyStudent && (
        <TouchableOpacity
          style={[styles.cta, styles.ctaSecondary, { borderColor: theme.divider }]}
          onPress={() => onBuy(productIds.yearlyStudent!)}
          activeOpacity={0.8}
        >
          <Text variant="title" color="primary">
            {MONETIZATION_PAYWALL_COPY.studentCta}
          </Text>
          <Text variant="body" color="secondary">
            {studentPrice}/year
          </Text>
          <Text variant="caption" color="secondary">
            {MONETIZATION_PAYWALL_COPY.studentSub}
          </Text>
        </TouchableOpacity>
      )}

      {showRestore && (
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
              Restore purchases
            </Text>
          )}
        </TouchableOpacity>
      )}

      <View style={styles.trustBlock}>
        {PAYWALL_TRUST_SIGNALS.map(signal => (
          <Text key={signal} variant="caption" color="secondary" style={styles.trustLine}>
            · {signal}
          </Text>
        ))}
      </View>

      <Text variant="caption" color="secondary" style={styles.legal}>
        {MONETIZATION_PAYWALL_COPY.freeForeverLine} {MONETIZATION_PAYWALL_COPY.regionalNote}
      </Text>
      <View style={styles.legalLinks}>
        <TouchableOpacity onPress={() => openLegalUrl(LEGAL_URLS.terms)} activeOpacity={0.7}>
          <Text variant="caption" color="secondary" style={styles.legalLink}>
            Terms of Service
          </Text>
        </TouchableOpacity>
        <Text variant="caption" color="secondary">
          {' · '}
        </Text>
        <TouchableOpacity onPress={() => openLegalUrl(LEGAL_URLS.privacy)} activeOpacity={0.7}>
          <Text variant="caption" color="secondary" style={styles.legalLink}>
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headline: { marginBottom: Spacing[2], lineHeight: 32 },
  subtitle: { marginBottom: Spacing[4], lineHeight: 22 },
  statusCard: {
    padding: Spacing[3],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderRadius: 12,
  },
  previewTitle: { marginBottom: Spacing[1] },
  previewBody: { lineHeight: 18 },
  benefitsBlock: { marginBottom: Spacing[4] },
  benefitsHeading: { letterSpacing: 1, marginBottom: Spacing[2] },
  benefitRow: { flexDirection: 'row', marginBottom: Spacing[1] },
  benefitBullet: { width: 22, color: '#22AA22' },
  benefitText: { flex: 1, lineHeight: 20 },
  disclosureCard: {
    padding: Spacing[3],
    marginBottom: Spacing[4],
    borderWidth: 1,
    borderRadius: 12,
  },
  disclosureLine: { lineHeight: 18, marginBottom: Spacing[1] },
  loader: { marginVertical: Spacing[2] },
  cta: {
    padding: Spacing[4],
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: Spacing[3],
  },
  ctaSecondary: { backgroundColor: 'rgba(255,255,255,0.04)' },
  ctaHighlight: { backgroundColor: 'rgba(255,255,255,0.08)' },
  ctaTitle: { marginBottom: Spacing[1] },
  ctaMeta: { marginTop: 4, lineHeight: 17 },
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
    marginBottom: Spacing[3],
  },
  trustBlock: { marginBottom: Spacing[3] },
  trustLine: { lineHeight: 18, marginBottom: 2 },
  legal: { lineHeight: 18, marginBottom: Spacing[2] },
  legalLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  legalLink: { textDecorationLine: 'underline' },
});
