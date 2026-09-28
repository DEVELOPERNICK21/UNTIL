/**
 * Shared paywall body — visual-first, psychology-led conversion.
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
  LayoutAnimation,
  UIManager,
  Vibration,
} from 'react-native';
import { Text } from '../../ui';
import { usePurchase } from '../../hooks/usePurchase';
import { useObserveSubscription } from '../../hooks/useObserveSubscription';
import { useAccessControl } from '../../hooks/useAccessControl';
import { useObserveTimeState } from '../../hooks/useObserveTimeState';
import {
  Spacing,
  useTheme,
  Radius,
  Weight,
  getFontFamilyForWeight,
} from '../../theme';
import {
  FALLBACK_LIFETIME_PRICE,
  FALLBACK_MONTHLY_PRICE,
  FALLBACK_STUDENT_YEARLY_PRICE,
  FALLBACK_WEEKLY_PRICE,
  FALLBACK_YEARLY_PRICE,
  MONETIZATION_FEATURE_FLAGS,
  MONETIZATION_PAYWALL_COPY,
  MONETIZATION_PRICING,
  LEGAL_URLS,
  buildSubscriptionDisclosure,
  formatInr,
  formatPaywallSocialProof,
  formatPreviewActiveBody,
  formatRenewalTerms,
  formatSubscribeCta,
} from '../../config/monetization';
import {
  logAnalyticsEvent,
  recordCrashError,
  type AnalyticsPaywallSource,
} from '../../services/analytics';
import {
  clearPendingPurchase,
  setPendingPurchase,
} from '../../services/purchaseAnalyticsContext';
import { PaywallVisualHero } from './PaywallVisualHero';
import { PaywallLossFrame } from './PaywallLossFrame';
import { PaywallFeatureTiles } from './PaywallFeatureTiles';
import { PaywallCompareStrip } from './PaywallCompareStrip';
import {
  PaywallPlanCards,
  type PaywallPlanOption,
} from './PaywallPlanCards';
import { StudentVerifyModal } from './StudentVerifyModal';
import { useStudentVerification } from '../../hooks/useStudentVerification';
import { useManageSubscription } from '../../hooks/useManageSubscription';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  /** Override life progress (0–1) for onboarding personalization */
  lifeProgress?: number;
}

export function PremiumPaywallBody({
  headline = MONETIZATION_PAYWALL_COPY.headline,
  subheadline = MONETIZATION_PAYWALL_COPY.subheadline,
  onPurchaseSuccess,
  showRestore = true,
  source = 'unknown',
  lifeProgress: lifeProgressProp,
}: PremiumPaywallBodyProps) {
  const theme = useTheme();
  const { isPremium } = useObserveSubscription();
  const { access } = useAccessControl();
  const { timeState } = useObserveTimeState();
  const {
    products,
    loading,
    productsError,
    offeringsReady,
    getProducts,
    requestPurchase,
    restorePurchases,
    productIds,
  } = usePurchase();
  const [restoring, setRestoring] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(productIds.yearly);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const { isVerified, verify, checkVerified } =
    useStudentVerification();

  const lifeProgress =
    lifeProgressProp ??
    (typeof timeState.life === 'number' ? timeState.life : undefined);

  useEffect(() => {
    void getProducts().catch(() => {});
  }, [getProducts]);

  const yearlyPrice = useMemo(
    () => priceLabel(products, productIds.yearly, FALLBACK_YEARLY_PRICE),
    [products, productIds.yearly]
  );
  const monthlyPrice = useMemo(
    () => priceLabel(products, productIds.monthly, FALLBACK_MONTHLY_PRICE),
    [products, productIds.monthly]
  );
  const weeklyPrice = useMemo(
    () =>
      priceLabel(
        products,
        productIds.weekly ?? 'weekly_subscription',
        FALLBACK_WEEKLY_PRICE
      ),
    [products, productIds.weekly]
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
    [products, productIds.yearlyStudent]
  );

  const monthlyAnchorYearly = useMemo(
    () => formatInr(MONETIZATION_PRICING.monthlyInr * 12),
    []
  );

  /** Three cards only: yearly (primary), monthly, weekly. */
  const planOptions = useMemo((): PaywallPlanOption[] => {
    const plans: PaywallPlanOption[] = [
      {
        productId: productIds.yearly,
        title: 'Yearly',
        subtitle: `Less than ${MONETIZATION_PRICING.yearlyPerDayDisplay}/day`,
        price: yearlyPrice,
        periodLabel: '/year',
        renewalInterval: 'year',
        comparePrice: `${monthlyAnchorYearly}/year`,
        badge: `Save ${MONETIZATION_PRICING.yearlySavingsVsMonthlyDisplay}`,
      },
      {
        productId: productIds.monthly,
        title: 'Monthly',
        subtitle: 'Flexible month to month',
        price: monthlyPrice,
        periodLabel: '/month',
        renewalInterval: 'month',
      },
    ];

    if (productIds.weekly) {
      plans.push({
        productId: productIds.weekly,
        title: 'Weekly',
        subtitle: 'Try Premium for a week',
        price: weeklyPrice,
        periodLabel: '/week',
        renewalInterval: 'week',
      });
    }

    return plans;
  }, [
    productIds.yearly,
    productIds.monthly,
    productIds.weekly,
    yearlyPrice,
    monthlyPrice,
    weeklyPrice,
    monthlyAnchorYearly,
  ]);

  const selectedPlan =
    planOptions.find(p => p.productId === selectedPlanId) ?? planOptions[0];

  const socialProofLine = useMemo(() => formatPaywallSocialProof(), []);

  const subscriptionDisclosure = useMemo(
    () =>
      buildSubscriptionDisclosure({
        yearlyPrice,
        monthlyPrice,
        weeklyPrice,
        lifetimePrice,
        trialActive: !isPremium && access.trialActive,
        trialEndsAtMs: access.trialEndsAt,
      }),
    [
      yearlyPrice,
      monthlyPrice,
      weeklyPrice,
      lifetimePrice,
      isPremium,
      access.trialActive,
      access.trialEndsAt,
    ]
  );

  const { openManageSubscription } = useManageSubscription();

  const openLegalUrl = useCallback((url: string) => {
    void Linking.openURL(url).catch(() => {
      Alert.alert('Could not open link', url);
    });
  }, []);

  const onBuy = useCallback(
    async (productId: string) => {
      if (purchasing || loading) {
        return;
      }
      if (!offeringsReady) {
        const list = await getProducts();
        if (list.length === 0) {
          Alert.alert(
            'Plans not ready',
            productsError ??
              'Could not load subscription plans from RevenueCat. Rebuild the app after setting REVENUECAT_API_KEY_* in .env, then check your network and the RevenueCat dashboard.'
          );
        }
        return;
      }
      if (
        productId === productIds.yearlyStudent &&
        !checkVerified()
      ) {
        setStudentModalOpen(true);
        void logAnalyticsEvent('student_verify_shown', { source });
        return;
      }
      Vibration.vibrate(10);
      const priceDisplay = priceLabel(products, productId, '');
      const wasTrialActive = access.trialActive;
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
      setPurchasing(true);
      try {
        const result = await requestPurchase(productId);
        if (result.status === 'cancelled') {
          clearPendingPurchase();
          void logAnalyticsEvent('premium_purchase_cancelled', {
            plan_id: productId,
            source,
          });
          return;
        }
        if (result.status === 'error') {
          clearPendingPurchase();
          void logAnalyticsEvent('premium_purchase_failed', {
            plan_id: productId,
            source,
            price_display: priceDisplay,
            error_code: 'purchase_failed',
            error_message: result.message,
            payment_provider: 'revenuecat',
          });
          recordCrashError(
            new Error(result.message),
            'PremiumPaywallBody.requestPurchase'
          );
          Alert.alert(
            'Purchase failed',
            result.message ||
              'Something went wrong. Check your connection and try again.'
          );
          return;
        }
        clearPendingPurchase();
        void logAnalyticsEvent('premium_purchase_completed', {
          plan_id: productId,
          source,
          price_display: priceDisplay,
          payment_provider: 'revenuecat',
        });
        if (wasTrialActive) {
          void logAnalyticsEvent('trial_preview_ended', {
            converted: 1,
            plan_id: productId,
          });
        }
        onPurchaseSuccess?.();
      } catch (e: unknown) {
        const err = e as { code?: string; message?: string };
        clearPendingPurchase();
        void logAnalyticsEvent('premium_purchase_failed', {
          plan_id: productId,
          source,
          price_display: priceDisplay,
          error_code: err?.code ?? 'unknown',
          error_message: err?.message ?? 'Unknown error',
          payment_provider: 'revenuecat',
        });
        recordCrashError(e, 'PremiumPaywallBody.requestPurchase');
        Alert.alert(
          'Purchase failed',
          err?.message ??
            'Something went wrong. Check your connection and try again.'
        );
      } finally {
        setPurchasing(false);
      }
    },
    [
      purchasing,
      loading,
      products,
      offeringsReady,
      productsError,
      getProducts,
      requestPurchase,
      source,
      productIds.yearlyStudent,
      checkVerified,
      access.trialActive,
      onPurchaseSuccess,
    ]
  );

  const onRestore = useCallback(async () => {
    setRestoring(true);
    try {
      const { restored } = await restorePurchases();
      Alert.alert(
        restored ? 'Restored' : 'Nothing to restore',
        restored
          ? 'Your purchase has been restored.'
          : 'No active purchase found for this account.'
      );
      if (restored) {
        void logAnalyticsEvent('premium_restore_completed', { source });
        onPurchaseSuccess?.();
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      recordCrashError(e, 'PremiumPaywallBody.restorePurchases');
      Alert.alert('Restore failed', err?.message ?? 'Try again later.');
    } finally {
      setRestoring(false);
    }
  }, [restorePurchases, onPurchaseSuccess, source]);

  const continueDisabled = purchasing || loading;

  return (
    <View>
      <PaywallVisualHero
        headline={headline}
        subheadline={subheadline}
        lifeProgress={lifeProgress}
      />

      {!isPremium && (
        <PaywallLossFrame
          lifeProgress={lifeProgress}
          trialActive={access.trialActive}
          trialEndsAtMs={access.trialEndsAt}
        />
      )}

      {isPremium && (
        <View
          style={[
            styles.statusCard,
            { borderColor: theme.percent, backgroundColor: theme.glassBg },
          ]}
        >
          <Text variant="body" color="primary">
            You have Premium active.
          </Text>
        </View>
      )}

      {!isPremium && access.trialActive && (
        <View
          style={[
            styles.statusCard,
            {
              borderColor: theme.percent,
              backgroundColor: 'rgba(232, 124, 32, 0.12)',
            },
          ]}
        >
          <Text
            variant="body"
            style={{
              color: theme.percent,
              marginBottom: Spacing[1],
              fontFamily: getFontFamilyForWeight(Weight.semibold),
            }}
          >
            {MONETIZATION_PAYWALL_COPY.previewActiveTitle}
          </Text>
          <Text variant="caption" color="secondary" style={styles.previewBody}>
            {formatPreviewActiveBody(access.trialEndsAt)}
          </Text>
        </View>
      )}

      {loading && (
        <ActivityIndicator color={theme.textPrimary} style={styles.loader} />
      )}

      {!loading && !offeringsReady && productsError && (
        <Text
          variant="caption"
          style={[styles.offeringsError, { color: theme.percent }]}
        >
          {productsError}
        </Text>
      )}

      {!isPremium && (
        <>
          <PaywallPlanCards
            plans={planOptions}
            selectedId={selectedPlan.productId}
            onSelect={setSelectedPlanId}
          />

          {selectedPlan.comparePrice ? (
            <Text
              variant="caption"
              style={[styles.priceRecap, { color: theme.textSecondary }]}
            >
              <Text style={styles.strike}>{selectedPlan.comparePrice}</Text>
              {'  '}
              {selectedPlan.price}
              {selectedPlan.periodLabel ?? ''}
            </Text>
          ) : (
            <Text
              variant="caption"
              style={[styles.priceRecap, { color: theme.textSecondary }]}
            >
              {selectedPlan.price}
              {selectedPlan.periodLabel
                ? ` ${selectedPlan.periodLabel.trim()}`
                : ''}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: theme.percent }]}
            onPress={() => void onBuy(selectedPlan.productId)}
            disabled={continueDisabled}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`${formatSubscribeCta(selectedPlan.renewalInterval)}. ${formatRenewalTerms(selectedPlan.price, selectedPlan.renewalInterval)}`}
          >
            <Text
              variant="body"
              style={{
                color: '#000',
                fontFamily: getFontFamilyForWeight(Weight.semibold),
              }}
            >
              {formatSubscribeCta(selectedPlan.renewalInterval)}
            </Text>
            <Text variant="micro" style={styles.continueSub}>
              {selectedPlan.price}
              {selectedPlan.periodLabel ?? ''} · cancel anytime
            </Text>
          </TouchableOpacity>

          <Text
            variant="caption"
            style={[styles.renewalTerms, { color: theme.textSecondary }]}
          >
            {formatRenewalTerms(selectedPlan.price, selectedPlan.renewalInterval)}
          </Text>

          <TouchableOpacity
            onPress={() => void onBuy(productIds.lifetime)}
            disabled={continueDisabled}
            style={styles.secondaryPlanHit}
            accessibilityRole="button"
            accessibilityLabel={`${MONETIZATION_PAYWALL_COPY.lifetimeSecondaryCta}, ${lifetimePrice}`}
          >
            <Text
              variant="caption"
              style={{ color: theme.textSecondary, textAlign: 'center' }}
            >
              {MONETIZATION_PAYWALL_COPY.lifetimeSecondaryCta} · {lifetimePrice}
            </Text>
          </TouchableOpacity>

          {MONETIZATION_FEATURE_FLAGS.studentPlanEnabled &&
          productIds.yearlyStudent ? (
            <TouchableOpacity
              onPress={() => {
                if (isVerified) {
                  void onBuy(productIds.yearlyStudent!);
                } else {
                  void logAnalyticsEvent('student_verify_shown', { source });
                  setStudentModalOpen(true);
                }
              }}
              disabled={continueDisabled}
              style={styles.secondaryPlanHit}
              accessibilityRole="button"
              accessibilityLabel={`${MONETIZATION_PAYWALL_COPY.studentCta}, ${studentPrice}`}
            >
              <Text
                variant="caption"
                style={{ color: theme.textMuted, textAlign: 'center' }}
              >
                {isVerified
                  ? `Student yearly · ${studentPrice}/year, renews yearly`
                  : `Student discount · ${studentPrice}/year, renews yearly`}
              </Text>
            </TouchableOpacity>
          ) : null}
        </>
      )}

      {socialProofLine ? (
        <Text
          variant="caption"
          style={[
            styles.socialProof,
            {
              color: theme.textSecondary,
              fontFamily: getFontFamilyForWeight(Weight.medium),
            },
          ]}
        >
          {socialProofLine}
        </Text>
      ) : null}

      <PaywallFeatureTiles />
      <PaywallCompareStrip />

      {/* Compact trust chips */}
      <View style={styles.trustRow}>
        {[
          'Cancel anytime',
          'Day + Year stay free',
          'Secure in-app purchase',
        ].map(signal => (
          <View
            key={signal}
            style={[
              styles.trustChip,
              {
                borderColor: theme.divider,
                backgroundColor: theme.glassBg,
              },
            ]}
          >
            <Text
              variant="micro"
              style={{ color: theme.textSecondary, textAlign: 'center' }}
            >
              {signal}
            </Text>
          </View>
        ))}
      </View>

      {showRestore && (
        <TouchableOpacity
          style={[styles.restoreBtn, { borderColor: theme.divider }]}
          onPress={() => void onRestore()}
          disabled={restoring}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Restore purchases"
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

      <TouchableOpacity
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setTermsOpen(v => !v);
        }}
        style={styles.termsToggle}
        activeOpacity={0.7}
      >
        <Text variant="caption" color="secondary">
          {termsOpen ? 'Hide subscription terms ▴' : 'Subscription & preview terms ▾'}
        </Text>
      </TouchableOpacity>

      {termsOpen && (
        <View
          style={[
            styles.disclosureCard,
            { borderColor: theme.divider, backgroundColor: theme.glassBg },
          ]}
        >
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
        </View>
      )}

      <Text variant="caption" color="secondary" style={styles.legal}>
        {MONETIZATION_PAYWALL_COPY.freeForeverLine}
      </Text>
      <View style={styles.legalLinks}>
        <TouchableOpacity
          onPress={() => openLegalUrl(LEGAL_URLS.terms)}
          activeOpacity={0.7}
        >
          <Text variant="caption" color="secondary" style={styles.legalLink}>
            Terms
          </Text>
        </TouchableOpacity>
        <Text variant="caption" color="secondary">
          {' · '}
        </Text>
        <TouchableOpacity
          onPress={() => openLegalUrl(LEGAL_URLS.privacy)}
          activeOpacity={0.7}
        >
          <Text variant="caption" color="secondary" style={styles.legalLink}>
            Privacy
          </Text>
        </TouchableOpacity>
        <Text variant="caption" color="secondary">
          {' · '}
        </Text>
        <TouchableOpacity
          onPress={() => openManageSubscription(source)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Manage or cancel subscription"
        >
          <Text variant="caption" color="secondary" style={styles.legalLink}>
            Manage subscription
          </Text>
        </TouchableOpacity>
      </View>

      <StudentVerifyModal
        visible={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
        verify={(email, confirmedMinimumAge) => {
          const result = verify(email, confirmedMinimumAge);
          if (!result.ok) {
            void logAnalyticsEvent('student_verify_failed', {
              source,
              reason: result.reason,
            });
          }
          return result;
        }}
        onVerified={() => {
          setStudentModalOpen(false);
          void logAnalyticsEvent('student_verify_succeeded', { source });
          if (productIds.yearlyStudent) {
            void onBuy(productIds.yearlyStudent);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  statusCard: {
    padding: Spacing[3],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderRadius: Radius.lg,
  },
  previewBody: { lineHeight: 18 },
  loader: { marginVertical: Spacing[2] },
  offeringsError: {
    textAlign: 'center',
    marginBottom: Spacing[2],
    paddingHorizontal: Spacing[2],
    lineHeight: 18,
  },
  socialProof: {
    textAlign: 'center',
    marginTop: Spacing[3],
    marginBottom: Spacing[3],
    letterSpacing: 0.2,
  },
  priceRecap: {
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  continueBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.full,
    marginBottom: Spacing[2],
  },
  continueSub: {
    color: 'rgba(0,0,0,0.65)',
    marginTop: 2,
    fontSize: 11,
    lineHeight: 14,
  },
  renewalTerms: {
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing[2],
    paddingHorizontal: Spacing[2],
  },
  secondaryPlanHit: {
    paddingVertical: Spacing[2],
    alignItems: 'center',
  },
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[1],
    marginTop: Spacing[2],
    marginBottom: Spacing[3],
  },
  trustChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[2],
    paddingVertical: 6,
    maxWidth: '100%',
  },
  restoreBtn: {
    paddingVertical: Spacing[3],
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing[2],
  },
  termsToggle: {
    alignItems: 'center',
    paddingVertical: Spacing[2],
    marginBottom: Spacing[1],
  },
  disclosureCard: {
    padding: Spacing[3],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderRadius: Radius.lg,
  },
  disclosureLine: { lineHeight: 18, marginBottom: Spacing[1] },
  legal: { lineHeight: 18, marginBottom: Spacing[2], textAlign: 'center' },
  legalLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  legalLink: { textDecorationLine: 'underline' },
});
