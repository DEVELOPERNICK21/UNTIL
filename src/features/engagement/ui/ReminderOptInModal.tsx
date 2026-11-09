import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '../../../shared/ui';
import { Spacing, Radius, useTheme } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useAnalytics } from '../../../shared/analytics/useAnalytics';

interface ReminderOptInModalProps {
  visible: boolean;
  /** Asks the system for permission and turns the reminder on. Resolves true when it is on. */
  onAccept: () => Promise<boolean>;
  onDismiss: () => void;
}

/**
 * One-time, value-first offer for the daily check-in. The system permission prompt only appears
 * after "Yes", so the person knows what it is for.
 */
export function ReminderOptInModal({
  visible,
  onAccept,
  onDismiss,
}: ReminderOptInModalProps) {
  const theme = useTheme();
  const { logEvent } = useAnalytics();
  const { t } = useTranslation();
  const [working, setWorking] = useState(false);

  if (!visible) return null;

  const handleAccept = async () => {
    setWorking(true);
    try {
      const on = await onAccept();
      logEvent('reminder_optin_accepted', { enabled: on });
    } finally {
      setWorking(false);
      onDismiss();
    }
  };

  const handleLater = () => {
    logEvent('reminder_optin_dismissed');
    onDismiss();
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.cardBaseAlpha }]}>
          <Text variant="title" color="primary" style={styles.title}>
            {t('engagement.reminder.title')}
          </Text>
          <Text variant="body" color="secondary" style={styles.body}>
            {t('engagement.reminder.body')}
          </Text>
          <TouchableOpacity
            style={[styles.primary, { backgroundColor: theme.percent }]}
            onPress={() => {
              void handleAccept();
            }}
            disabled={working}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel={t('engagement.reminder.accept')}
          >
            {working ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text variant="sectionTitle" style={styles.primaryLabel}>
                {t('engagement.reminder.accept')}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondary}
            onPress={handleLater}
            disabled={working}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('common.notNow')}
          >
            <Text variant="body" color="secondary">
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
  title: { marginBottom: Spacing[2] },
  body: { marginBottom: Spacing[4], lineHeight: 22 },
  primary: {
    borderRadius: Radius.md,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  primaryLabel: { color: '#FFFFFF' },
  secondary: { alignItems: 'center', paddingVertical: Spacing[2] },
});
