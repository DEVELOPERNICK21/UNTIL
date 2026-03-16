import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../../ui';
import { useTheme, Spacing, Radius } from '../../theme';
import { openStoreUrl } from '../../services/updateService';

interface OptionalUpdateModalProps {
  visible: boolean;
  storeUrl?: string;
  onDismiss: () => void;
}

export function OptionalUpdateModal({
  visible,
  storeUrl,
  onDismiss,
}: OptionalUpdateModalProps) {
  const theme = useTheme();

  if (!visible) return null;

  const handleUpdate = () => {
    openStoreUrl(storeUrl);
  };

  const handleLater = () => {
    onDismiss();
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
            Update Available
          </Text>
          <Text
            variant="body"
            style={[styles.message, { color: theme.textSecondary }]}
          >
            A new version of UNTIL is available.
          </Text>

          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                { borderColor: theme.divider },
              ]}
              activeOpacity={0.9}
              onPress={handleLater}
            >
              <Text
                variant="sectionTitle"
                style={[styles.secondaryLabel, { color: theme.textPrimary }]}
              >
                Later
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: theme.percent },
              ]}
              activeOpacity={0.9}
              onPress={handleUpdate}
            >
              <Text variant="sectionTitle" style={styles.primaryLabel}>
                Update
              </Text>
            </TouchableOpacity>
          </View>
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
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing[2],
  },
  secondaryButton: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  secondaryLabel: {},
  primaryButton: {
    flex: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  primaryLabel: {
    color: '#FFFFFF',
  },
});

