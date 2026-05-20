import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../../ui';
import { Spacing, Radius, useTheme } from '../../theme';
import { getTrialReminderMessage } from '../../services/trialReminders';
import { recordPaywallDismissed } from '../../services/paywallPrompt';
import { navigateToPremium } from '../../navigation/rootNavigationRef';

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
            Trial ending soon
          </Text>
          <Text variant="body" style={{ color: theme.textSecondary, marginBottom: Spacing[4] }}>
            {getTrialReminderMessage(trialDay)}
          </Text>
          <TouchableOpacity
            style={[styles.primary, { backgroundColor: theme.percent }]}
            onPress={handleUpgrade}
            activeOpacity={0.9}
          >
            <Text variant="sectionTitle" style={styles.primaryLabel}>
              View Premium plans
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
  primaryLabel: { color: '#FFFFFF' },
  secondary: { alignItems: 'center', paddingVertical: Spacing[2] },
});
