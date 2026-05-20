import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from '../../ui';
import { Spacing, Radius, useTheme } from '../../theme';
import { MONETIZATION_PAYWALL_COPY } from '../../config/monetization';
import { recordPaywallDismissed } from '../../services/paywallPrompt';
import type { RootStackParamList } from '../../navigation/RootNavigator';

interface LifeUnlockEndedModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export function LifeUnlockEndedModal({
  visible,
  onDismiss,
}: LifeUnlockEndedModalProps) {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (!visible) return null;

  const handleLater = () => {
    recordPaywallDismissed();
    onDismiss();
  };

  const handleUpgrade = () => {
    recordPaywallDismissed();
    onDismiss();
    navigation.navigate('Premium');
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.cardBaseAlpha }]}>
          <Text variant="title" style={{ color: theme.textPrimary, marginBottom: Spacing[2] }}>
            {MONETIZATION_PAYWALL_COPY.lifeUnlockEndedTitle}
          </Text>
          <Text variant="body" style={{ color: theme.textSecondary, marginBottom: Spacing[4] }}>
            {MONETIZATION_PAYWALL_COPY.lifeUnlockEndedMessage}
          </Text>
          <TouchableOpacity
            style={[styles.primary, { backgroundColor: theme.percent }]}
            onPress={handleUpgrade}
            activeOpacity={0.9}
          >
            <Text variant="sectionTitle" style={styles.primaryLabel}>
              See Premium plans
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
  card: {
    borderRadius: Radius.lg,
    padding: Spacing[4],
  },
  primary: {
    borderRadius: Radius.md,
    paddingVertical: Spacing[3],
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  primaryLabel: { color: '#FFFFFF' },
  secondary: {
    alignItems: 'center',
    paddingVertical: Spacing[2],
  },
});
