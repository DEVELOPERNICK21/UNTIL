import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../../ui';
import { Spacing, Radius, useTheme } from '../../theme';
import { rootNavigationRef } from '../../navigation/rootNavigationRef';
import { useGoalsFeatureEnabled, useAnalytics } from '../../hooks';

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
            Go deeper with UNTIL
          </Text>
          <Text variant="body" color="secondary" style={styles.body}>
            Tap into today&apos;s detail or try daily tasks to build a rhythm around
            your time.
          </Text>
          <TouchableOpacity
            style={[styles.primary, { backgroundColor: theme.percent }]}
            onPress={() => navigateTo('day_detail')}
            activeOpacity={0.9}
          >
            <Text variant="sectionTitle" style={styles.primaryLabel}>
              Explore today&apos;s detail
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryCta, { borderColor: theme.progressTrack }]}
            onPress={() => navigateTo('daily_tasks')}
            activeOpacity={0.9}
          >
            <Text variant="sectionTitle" style={{ color: theme.textPrimary }}>
              Try daily tasks
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondary}
            onPress={handleLater}
            activeOpacity={0.7}
          >
            <Text variant="body" color="secondary">
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
