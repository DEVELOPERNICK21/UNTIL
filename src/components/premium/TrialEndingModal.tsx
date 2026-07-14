import React, { useEffect, useMemo } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../../ui';
import { Spacing, Radius, useTheme } from '../../theme';
import { getTrialReminderMessage } from '../../services/trialReminders';
import { recordPaywallDismissed } from '../../services/paywallPrompt';
import { navigateToPremium } from '../../navigation/rootNavigationRef';
import { logAnalyticsEvent } from '../../services/analytics';
import { usePurchase } from '../../hooks/usePurchase';
import {
  FALLBACK_YEARLY_PRICE,
  MONETIZATION_PAYWALL_COPY,
} from '../../config/monetization';

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
  const { products, productIds, getProducts } = usePurchase();

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
    recordPaywallDismissed();
    onDismiss();
    navigateToPremium();
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.cardBaseAlpha }]}>
          <Text variant="title" style={{ color: theme.textPrimary, marginBottom: Spacing[2] }}>
            Free app preview ending soon
          </Text>
          <Text variant="body" style={{ color: theme.textSecondary, marginBottom: Spacing[2] }}>
            {getTrialReminderMessage(trialDay, yearlyPrice)}
          </Text>
          <Text variant="caption" style={{ color: theme.textSecondary, marginBottom: Spacing[4] }}>
            {MONETIZATION_PAYWALL_COPY.previewEndingNoChargeNote}{' '}
            {MONETIZATION_PAYWALL_COPY.previewEndingCancelNote}
          </Text>
          <TouchableOpacity
            style={[styles.primary, { backgroundColor: theme.percent }]}
            onPress={handleUpgrade}
            activeOpacity={0.9}
          >
            <Text variant="sectionTitle" style={styles.primaryLabel}>
              View Premium plans ({yearlyPrice}/year)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondary} onPress={handleLater} activeOpacity={0.7}>
            <Text variant="body" style={{ color: theme.textSecondary }}>
              Not now
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
  },
  primaryLabel: { color: '#FFFFFF', textAlign: 'center' },
  secondary: { alignItems: 'center', paddingVertical: Spacing[2] },
});
