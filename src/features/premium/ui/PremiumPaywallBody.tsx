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
import { Text } from '../../../shared/ui';
import { usePurchase } from '../hooks/usePurchase';
import { priceLabel, usePaywallPrices } from '../hooks/usePaywallPrices';
import { useObserveSubscription } from '../hooks/useObserveSubscription';
import { useAccessControl } from '../hooks/useAccessControl';
import { useObserveTimeState } from '../../time';
import {
  Spacing,
  useTheme,
  Radius,
  Weight,
  getFontFamilyForWeight,
} from '../../../shared/theme';
import {
  MONETIZATION_FEATURE_FLAGS,
  LEGAL_URLS,
} from '../../../config/monetization';
import {
  buildSubscriptionDisclosure,
  formatPaywallSocialProof,
  formatPreviewActiveBody,
  formatRenewalTerms,
  formatSubscribeCta,
} from '../../../config/paywallCopy';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import {
  logAnalyticsEvent,
  recordCrashError,
  type AnalyticsPaywallSource,
} from '../../../shared/analytics/analytics';
import {
  clearPendingPurchase,
  setPendingPurchase,
} from '../services/purchaseAnalyticsContext';
import { PaywallVisualHero } from './PaywallVisualHero';
import { PaywallLossFrame } from './PaywallLossFrame';
import { PaywallFeatureTiles } from './PaywallFeatureTiles';
import { PaywallCompareStrip } from './PaywallCompareStrip';
import { PaywallPlanCards } from './PaywallPlanCards';
import { StudentVerifyModal } from './StudentVerifyModal';
import { useStudentVerification } from '../hooks/useStudentVerification';
import { useManageSubscription } from '../hooks/useManageSubscription';
import { usePaywallVisit } from '../hooks/usePaywallVisit';
import {
  logPlanSelected,
  logPurchaseFailed,
  logRestoreEmpty,
  logRestoreFailed,
  purchaseRevenueParams,
} from '../services/paywallTelemetry';
import { buildPaywallPlans } from './paywallPlans';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
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
  headline: headlineProp,
  subheadline: subheadlineProp,
  onPurchaseSuccess,
  showRestore = true,
  source = 'unknown',
  lifeProgress: lifeProgressProp,
}: PremiumPaywallBodyProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const headline = headlineProp ?? t('premium.paywall.headline');
  const subheadline = subheadlineProp ?? t('premium.paywall.subheadline');
  const { isPremium } = useObserveSubscription();
  const markVisitConverted = usePaywallVisit(source, isPremium);
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
  const [selectedPlanId, setSelectedPlanId] = useState<string>(productIds.yearly);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const { isVerified, verify, checkVerified } =
    useStudentVerification();

  const lifeProgress =
    lifeProgressProp ??
    (typeof timeState.life === 'number' ? timeState.life : undefined);

  useEffect(() => {
    void getProducts().catch(() => {});
  }, [getProducts]);

  const prices = usePaywallPrices(products, productIds);
  const {
    yearly: yearlyPrice,
    monthly: monthlyPrice,
    weekly: weeklyPrice,
    lifetime: lifetimePrice,
    student: studentPrice,
  } = prices;

  /** Three cards only: yearly (primary), monthly, weekly. */
  const planOptions = useMemo(
    () => buildPaywallPlans(productIds, prices, t),
    [productIds, prices, t],
  );

  const selectedPlan =
    planOptions.find(p => p.productId === selectedPlanId) ?? planOptions[0];

  const socialProofLine = formatPaywallSocialProof();

  // Built on demand: the lines are translated and only shown once the terms are opened.
  const subscriptionDisclosure = termsOpen
    ? buildSubscriptionDisclosure({
        yearlyPrice,
        monthlyPrice,
        weeklyPrice,
        lifetimePrice,
        trialActive: !isPremium && access.trialActive,
        trialEndsAtMs: access.trialEndsAt,
      })
    : [];

  const { openManageSubscription } = useManageSubscription();

  const openLegalUrl = useCallback((url: string) => {
    void Linking.openURL(url).catch(() => {
      Alert.alert(t('premium.alert.linkTitle'), url);
    });
  }, [t]);

  const onBuy = useCallback(
    async (productId: string) => {
      if (purchasing || loading) {
        return;
      }
      if (!offeringsReady) {
        const list = await getProducts();
        if (list.length === 0) {
          Alert.alert(
            t('premium.alert.plansNotReady'),
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
          logPurchaseFailed({
            planId: productId,
            source,
            priceDisplay,
            code: result.code,
            message: result.message,
          });
          recordCrashError(
            new Error(result.message),
            'PremiumPaywallBody.requestPurchase'
          );
          Alert.alert(
            t('premium.alert.purchaseFailed'),
            result.message || t('premium.alert.genericError')
          );
          return;
        }
        clearPendingPurchase();
        void logAnalyticsEvent('premium_purchase_completed', {
          plan_id: productId,
          source,
          price_display: priceDisplay,
          payment_provider: 'revenuecat',
          ...purchaseRevenueParams(products, productId),
        });
        if (wasTrialActive) {
          void logAnalyticsEvent('trial_preview_ended', {
            converted: 1,
            plan_id: productId,
          });
        }
        markVisitConverted();
        onPurchaseSuccess?.();
      } catch (e: unknown) {
        const err = e as { code?: string; message?: string };
        clearPendingPurchase();
        logPurchaseFailed({
          planId: productId,
          source,
          priceDisplay,
          code: err?.code,
          message: err?.message,
        });
        recordCrashError(e, 'PremiumPaywallBody.requestPurchase');
        Alert.alert(
          t('premium.alert.purchaseFailed'),
          err?.message ?? t('premium.alert.genericError')
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
      markVisitConverted,
      t,
    ]
  );

  const onRestore = useCallback(async () => {
    setRestoring(true);
    try {
      const { restored } = await restorePurchases();
      Alert.alert(
        restored
          ? t('premium.alert.restored')
          : t('premium.alert.nothingToRestore'),
        restored
          ? t('premium.alert.restoredBody')
          : t('premium.alert.nothingToRestoreBody')
      );
      if (restored) {
        void logAnalyticsEvent('premium_restore_completed', { source });
        markVisitConverted();
        onPurchaseSuccess?.();
      } else {
        logRestoreEmpty(source);
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      logRestoreFailed(source, e);
      recordCrashError(e, 'PremiumPaywallBody.restorePurchases');
      Alert.alert(
        t('premium.alert.restoreFailed'),
        err?.message ?? t('premium.alert.tryLater')
      );
    } finally {
      setRestoring(false);
    }
  }, [restorePurchases, onPurchaseSuccess, markVisitConverted, source, t]);

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
            {t('premium.paywall.active')}
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
            {t('premium.preview.activeTitle')}
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
            onSelect={id => {
              setSelectedPlanId(id);
              logPlanSelected(source, id);
            }}
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
              {t('premium.cta.priceLine', {
                price: `${selectedPlan.price}${selectedPlan.periodLabel ?? ''}`,
              })}
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
            accessibilityLabel={t('premium.cta.lifetime', { price: lifetimePrice })}
          >
            <Text
              variant="caption"
              style={{ color: theme.textSecondary, textAlign: 'center' }}
            >
              {t('premium.cta.lifetime', { price: lifetimePrice })}
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
              accessibilityLabel={t('premium.student.a11y', { price: studentPrice })}
            >
              <Text
                variant="caption"
                style={{ color: theme.textMuted, textAlign: 'center' }}
              >
                {t(
                  isVerified
                    ? 'premium.student.verified'
                    : 'premium.student.unverified',
                  { price: studentPrice },
                )}
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
          t('premium.trust.cancel'),
          t('premium.trust.free'),
          t('premium.trust.secure'),
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
          accessibilityLabel={t('premium.restore')}
        >
          {restoring ? (
            <ActivityIndicator color={theme.textPrimary} />
          ) : (
            <Text variant="body" color="primary">
              {t('premium.restore')}
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
          {t(termsOpen ? 'premium.terms.hide' : 'premium.terms.show')}
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
        {t('premium.paywall.freeForever')}
      </Text>
      <View style={styles.legalLinks}>
        <TouchableOpacity
          onPress={() => openLegalUrl(LEGAL_URLS.terms)}
          activeOpacity={0.7}
        >
          <Text variant="caption" color="secondary" style={styles.legalLink}>
            {t('premium.legal.terms')}
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
            {t('premium.legal.privacy')}
          </Text>
        </TouchableOpacity>
        <Text variant="caption" color="secondary">
          {' · '}
        </Text>
        <TouchableOpacity
          onPress={() => openManageSubscription(source)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('premium.manage.a11y')}
        >
          <Text variant="caption" color="secondary" style={styles.legalLink}>
            {t('premium.manage.link')}
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
