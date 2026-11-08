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
import { AgeConfirmationCheck, Text } from '../../../shared/ui';
import {
  Spacing,
  Radius,
  useTheme,
  Weight,
  getFontFamilyForWeight,
} from '../../../shared/theme';
import { MINIMUM_ACCOUNT_AGE_YEARS } from '../../account';
import { t as translate } from '../../../shared/i18n/translate';
import { useTranslation } from '../../../shared/i18n/useTranslation';

type StudentVerifyFailure =
  | 'invalid'
  | 'confirmation_required'
  | 'under_minimum_age';

interface StudentVerifyModalProps {
  visible: boolean;
  onClose: () => void;
  onVerified: (email: string) => void;
  verify: (
    email: string,
    confirmedMinimumAge: boolean
  ) => { ok: true } | { ok: false; reason: StudentVerifyFailure };
}

function failureCopy(reason: StudentVerifyFailure): string {
  switch (reason) {
    case 'invalid':
      return translate('premium.student.error.invalid');
    case 'confirmation_required':
      return translate('premium.student.error.confirm', {
        age: MINIMUM_ACCOUNT_AGE_YEARS,
      });
    case 'under_minimum_age':
      return translate('premium.student.error.underAge', {
        age: MINIMUM_ACCOUNT_AGE_YEARS,
      });
  }
}

export function StudentVerifyModal({
  visible,
  onClose,
  onVerified,
  verify,
}: StudentVerifyModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  const handleSubmit = () => {
    const result = verify(email, ageConfirmed);
    if (!result.ok) {
      setError(failureCopy(result.reason));
      if (result.reason === 'under_minimum_age') setEmail('');
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
            {t('premium.student.title')}
          </Text>
          <Text variant="body" color="secondary" style={styles.body}>
            {t('premium.student.body')}
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
          <AgeConfirmationCheck
            checked={ageConfirmed}
            onChange={next => {
              setAgeConfirmed(next);
              if (error) setError(null);
            }}
            minimumAge={MINIMUM_ACCOUNT_AGE_YEARS}
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
                {t('common.cancel')}
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
                {t('common.continue')}
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
