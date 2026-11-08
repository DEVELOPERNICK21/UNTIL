import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../../../shared/ui';
import { Spacing, Radius, useTheme } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { rootNavigationRef } from '../../../shared/navigation/rootNavigationRef';
import {
  useGoalsFeatureEnabled,
} from '../../../shared/featureFlags/useGoalsFeatureEnabled';
import { useAnalytics } from '../../../shared/analytics/useAnalytics';

interface FeatureDiscoveryModalProps {
  visible: boolean;
  onDismiss: () => void;
  onCta: () => void;
}

export function FeatureDiscoveryModal({
  visible,
  onDismiss,
  onCta,
}: FeatureDiscoveryModalProps) {
  const theme = useTheme();
  const goalsFeatureEnabled = useGoalsFeatureEnabled();
  const { logEvent } = useAnalytics();
  const { t } = useTranslation();

  if (!visible) return null;

  const handleLater = () => {
    logEvent('feature_coach_dismissed', { dismiss_reason: 'tapped_not_now' });
    onDismiss();
  };

  const navigateTo = (target: 'day_detail' | 'daily_tasks') => {
    logEvent('feature_coach_cta_tapped', { target });
    onCta();
    if (!rootNavigationRef.isReady()) return;
    if (target === 'day_detail') {
      rootNavigationRef.navigate('DayDetail');
      return;
    }
    rootNavigationRef.navigate(
      goalsFeatureEnabled ? 'DailyTasks' : 'TasksComingSoon'
    );
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.cardBaseAlpha }]}>
          <Text variant="title" color="primary" style={styles.title}>
            {t('engagement.discovery.title')}
          </Text>
          <Text variant="body" color="secondary" style={styles.body}>
            {t('engagement.discovery.body')}
          </Text>
          <TouchableOpacity
            style={[styles.primary, { backgroundColor: theme.percent }]}
            onPress={() => navigateTo('day_detail')}
            activeOpacity={0.9}
          >
            <Text variant="sectionTitle" style={styles.primaryLabel}>
              {t('engagement.discovery.explore')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryCta, { borderColor: theme.progressTrack }]}
            onPress={() => navigateTo('daily_tasks')}
            activeOpacity={0.9}
          >
            <Text variant="sectionTitle" style={{ color: theme.textPrimary }}>
              {t('engagement.discovery.tasks')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondary}
            onPress={handleLater}
            activeOpacity={0.7}
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
    paddingVertical: Spacing[3],
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  primaryLabel: { color: '#FFFFFF' },
  secondaryCta: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing[3],
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  secondary: { alignItems: 'center', paddingVertical: Spacing[2] },
});
