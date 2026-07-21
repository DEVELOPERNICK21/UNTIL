import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../../ui';
import { Spacing, Radius, useTheme } from '../../theme';
import { rootNavigationRef } from '../../navigation/rootNavigationRef';
import { useAnalytics } from '../../hooks/useAnalytics';

interface SharePromptModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export function SharePromptModal({ visible, onDismiss }: SharePromptModalProps) {
  const theme = useTheme();
  const { logEvent } = useAnalytics();

  if (!visible) return null;

  const handleLater = () => {
    logEvent('share_prompt_dismissed');
    onDismiss();
  };

  const handleShare = () => {
    logEvent('share_prompt_tapped');
    onDismiss();
    if (rootNavigationRef.isReady()) {
      rootNavigationRef.navigate('ShareSnapshot');
    }
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.cardBaseAlpha }]}>
          <Text variant="title" color="primary" style={styles.title}>
            Your countdown reached today
          </Text>
          <Text variant="body" color="secondary" style={styles.body}>
            Share the moment. Capture how much of your day, month, or year is left.
          </Text>
          <TouchableOpacity
            style={[styles.primary, { backgroundColor: theme.percent }]}
            onPress={handleShare}
            activeOpacity={0.9}
          >
            <Text variant="sectionTitle" style={styles.primaryLabel}>
              Share snapshot
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondary} onPress={handleLater} activeOpacity={0.7}>
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
  secondary: { alignItems: 'center', paddingVertical: Spacing[2] },
});
