import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../../ui';
import { useTheme, Spacing, Radius } from '../../theme';
import { openStoreUrl } from '../../services/updateService';

interface ForceUpdateModalProps {
  visible: boolean;
  storeUrl?: string;
}

export function ForceUpdateModal({ visible, storeUrl }: ForceUpdateModalProps) {
  const theme = useTheme();

  if (!visible) return null;

  const handleUpdate = () => {
    openStoreUrl(storeUrl);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View
          style={[styles.card, { backgroundColor: theme.cardBaseAlpha }]}
        >
          <Text
            variant="title"
            style={[styles.title, { color: theme.textPrimary }]}
          >
            Update Required
          </Text>
          <Text
            variant="body"
            style={[styles.message, { color: theme.textSecondary }]}
          >
            To continue using UNTIL, please update to the latest version.
          </Text>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.percent }]}
            activeOpacity={0.9}
            onPress={handleUpdate}
          >
            <Text variant="sectionTitle" style={styles.primaryButtonLabel}>
              Update Now
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[4],
  },
  card: {
    width: '100%',
    borderRadius: Radius.lg,
    padding: Spacing[4],
  },
  title: {
    marginBottom: Spacing[2],
  },
  message: {
    marginBottom: Spacing[4],
  },
  primaryButton: {
    borderRadius: Radius.md,
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  primaryButtonLabel: {
    color: '#FFFFFF',
  },
});

