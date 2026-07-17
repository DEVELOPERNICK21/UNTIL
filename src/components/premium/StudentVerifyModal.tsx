import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text } from '../../ui';
import {
  Spacing,
  Radius,
  useTheme,
  Weight,
  getFontFamilyForWeight,
} from '../../theme';

interface StudentVerifyModalProps {
  visible: boolean;
  onClose: () => void;
  onVerified: (email: string) => void;
  verify: (email: string) => { ok: true } | { ok: false; reason: 'invalid' };
}

export function StudentVerifyModal({
  visible,
  onClose,
  onVerified,
  verify,
}: StudentVerifyModalProps) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const result = verify(email);
    if (!result.ok) {
      setError('Use a school email (.edu, .ac.in, .edu.in, etc.).');
      return;
    }
    setError(null);
    onVerified(email.trim().toLowerCase());
    setEmail('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: theme.cardBase, borderColor: theme.divider },
          ]}
        >
          <Text variant="title" color="primary" style={styles.title}>
            Verify student email
          </Text>
          <Text variant="body" color="secondary" style={styles.body}>
            Enter a school email to unlock the student yearly price. Same Premium
            features — soft check only (no document upload).
          </Text>
          <TextInput
            value={email}
            onChangeText={text => {
              setEmail(text);
              if (error) setError(null);
            }}
            placeholder="you@university.edu"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={[
              styles.input,
              {
                color: theme.textPrimary,
                borderColor: error ? '#E85C5C' : theme.divider,
                backgroundColor: theme.glassBg,
              },
            ]}
          />
          {error ? (
            <Text variant="caption" style={{ color: '#E85C5C' }}>
              {error}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, { borderColor: theme.divider }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text variant="body" color="secondary">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, { backgroundColor: theme.percent }]}
              onPress={handleSubmit}
              activeOpacity={0.85}
            >
              <Text
                variant="body"
                style={{
                  color: '#0E0E10',
                  fontFamily: getFontFamilyForWeight(Weight.semibold),
                }}
              >
                Continue
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing[4],
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  title: {
    marginBottom: Spacing[1],
  },
  body: {
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: Spacing[1],
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  btnPrimary: {
    borderWidth: 0,
  },
});
