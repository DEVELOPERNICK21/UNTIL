import React, { useEffect, useMemo } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from '../../../shared/ui';
import { Spacing, Radius, useTheme } from '../../../shared/theme';
import { getTrialReminderMessage } from '../services/trialReminders';
import { recordPaywallDismissed } from '../services/paywallPrompt';
import { navigateToPremium } from '../../../shared/navigation/rootNavigationRef';
import { logAnalyticsEvent } from '../../../shared/analytics/analytics';
import { usePurchase } from '../hooks/usePurchase';
import { usePresentRevenueCatPaywall } from '../hooks/usePresentRevenueCatPaywall';
import { FALLBACK_YEARLY_PRICE } from '../../../config/monetization';
import { joinSentences } from '../../../config/paywallCopy';
import { useTranslation } from '../../../shared/i18n/useTranslation';


interface TrialEndingModalProps {
  visible: boolean;
  trialDay: number;
  onDismiss: () => void;
}

export function TrialEndingModal({
  visible,
  trialDay,
  onDismiss,
}: TrialEndingModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { products, productIds, getProducts } = usePurchase();
  const { present, presenting } = usePresentRevenueCatPaywall('trial_ending_modal');

  useEffect(() => {
    if (visible) {
      void getProducts().catch(() => {});
      void logAnalyticsEvent('premium_viewed', { source: 'trial_ending_modal' });
    }
  }, [visible, getProducts]);

  const yearlyPrice = useMemo(() => {
    const match = products.find(p => p.productId === productIds.yearly);
    return match?.price ?? FALLBACK_YEARLY_PRICE;
  }, [products, productIds.yearly]);

  if (!visible) return null;

  const handleLater = () => {
    recordPaywallDismissed();
    onDismiss();
  };

  const handleUpgrade = () => {
    void (async () => {
      // Dismiss this RN Modal before native RC paywall to avoid a touch blocker.
      recordPaywallDismissed();
      onDismiss();
      const result = await present();
      if (result === 'purchased' || result === 'restored') {
        return;
      }
      // Closed RC or unavailable → custom main paywall
      navigateToPremium();
    })();
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.cardBaseAlpha }]}>
          <Text variant="title" style={{ color: theme.textPrimary, marginBottom: Spacing[2] }}>
            {t('premium.preview.endingTitle')}
          </Text>
          <Text variant="body" style={{ color: theme.textSecondary, marginBottom: Spacing[2] }}>
            {getTrialReminderMessage(trialDay, yearlyPrice)}
          </Text>
          <Text variant="caption" style={{ color: theme.textSecondary, marginBottom: Spacing[4] }}>
            {joinSentences(
              t('premium.preview.noChargeNote'),
              t('premium.preview.cancelNote'),
            )}
          </Text>
          <TouchableOpacity
            style={[styles.primary, { backgroundColor: theme.percent }]}
            onPress={handleUpgrade}
            activeOpacity={0.9}
            disabled={presenting}
          >
            {presenting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text variant="sectionTitle" style={styles.primaryLabel}>
                {t('premium.preview.viewPlans', { price: yearlyPrice })}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondary}
            onPress={handleLater}
            activeOpacity={0.7}
            disabled={presenting}
          >
            <Text variant="body" style={{ color: theme.textSecondary }}>
              {t('common.notNow')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    padding: Spacing[4],
  },
  card: { borderRadius: Radius.lg, padding: Spacing[4] },
  primary: {
    borderRadius: Radius.md,
    paddingVertical: Spacing[3],
    alignItems: 'center',
    marginBottom: Spacing[2],
    minHeight: 48,
    justifyContent: 'center',
  },
  primaryLabel: { color: '#FFFFFF', textAlign: 'center' },
  secondary: { alignItems: 'center', paddingVertical: Spacing[2] },
});
