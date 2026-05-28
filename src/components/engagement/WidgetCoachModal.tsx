import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text } from '../../ui';
import { Spacing, Radius, useTheme } from '../../theme';
import { rootNavigationRef } from '../../navigation/rootNavigationRef';
import { clearWidgetCoachPending } from '../../services/onboardingCompletion';
import { logAnalyticsEvent } from '../../services/analytics';

interface WidgetCoachModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export function WidgetCoachModal({ visible, onDismiss }: WidgetCoachModalProps) {
  const theme = useTheme();

  if (!visible) return null;

  const handleAddWidget = () => {
    logAnalyticsEvent('widget_add_tapped', { source: 'coach' }).catch(() => {});
    clearWidgetCoachPending();
    onDismiss();
    if (rootNavigationRef.isReady()) {
      rootNavigationRef.navigate('Widget');
    }
  };

  const handleLater = () => {
    logAnalyticsEvent('widget_coach_dismissed').catch(() => {});
    clearWidgetCoachPending();
    onDismiss();
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.cardBaseAlpha }]}>
          <Text variant="title" color="primary" style={styles.title}>
            Add the Day widget
          </Text>
          <Text variant="body" color="secondary" style={styles.body}>
            Pin UNTIL to your home screen to see how much of today and this month
            is left — without opening the app.
          </Text>
          <TouchableOpacity
            style={[styles.primary, { backgroundColor: theme.percent }]}
            onPress={handleAddWidget}
            activeOpacity={0.9}
          >
            <Text variant="sectionTitle" style={styles.primaryLabel}>
              Set up widgets
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondary} onPress={handleLater} activeOpacity={0.7}>
            <Text variant="body" color="secondary">
              Not now
            </Text>
          </TouchableOpacity>
          {Platform.OS === 'android' ? (
            <Text variant="caption" color="secondary" style={styles.hint}>
              Long-press home screen → Widgets → UNTIL → Day
            </Text>
          ) : null}
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
  secondary: { alignItems: 'center', paddingVertical: Spacing[2] },
  hint: { marginTop: Spacing[2], textAlign: 'center', lineHeight: 18 },
});
