/**
 * Shared email + password fields for account sign-in / create.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../../ui';
import {
  useTheme,
  Spacing,
  Radius,
  Weight,
  getFontFamilyForWeight,
} from '../../theme';

export type EmailAuthMode = 'sign_in' | 'create';

interface EmailPasswordAuthFormProps {
  email: string;
  password: string;
  mode: EmailAuthMode;
  busy: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onModeChange: (mode: EmailAuthMode) => void;
  onSubmit: () => void;
}

export function EmailPasswordAuthForm({
  email,
  password,
  mode,
  busy,
  onEmailChange,
  onPasswordChange,
  onModeChange,
  onSubmit,
}: EmailPasswordAuthFormProps) {
  const theme = useTheme();
  const isLight = theme.statusBarStyle === 'dark-content';
  const submitLabel = mode === 'sign_in' ? 'Sign in with email' : 'Create account';
  const switchLabel =
    mode === 'sign_in'
      ? 'Need an account? Create one'
      : 'Already have an account? Sign in';

  const fieldStyle = [
    styles.field,
    {
      color: theme.textPrimary,
      backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
      borderColor: isLight ? 'rgba(26,26,26,0.1)' : 'rgba(255,255,255,0.14)',
    },
  ];

  return (
    <View style={styles.wrap}>
      <TextInput
        value={email}
        onChangeText={onEmailChange}
        placeholder="Email"
        placeholderTextColor={theme.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        editable={!busy}
        style={fieldStyle}
        accessibilityLabel="Email"
      />
      <TextInput
        value={password}
        onChangeText={onPasswordChange}
        placeholder="Password"
        placeholderTextColor={theme.textMuted}
        secureTextEntry
        textContentType={mode === 'create' ? 'newPassword' : 'password'}
        autoComplete={mode === 'create' ? 'new-password' : 'password'}
        editable={!busy}
        style={fieldStyle}
        accessibilityLabel="Password"
        onSubmitEditing={onSubmit}
      />
      <TouchableOpacity
        style={[styles.submit, { backgroundColor: theme.percent }]}
        onPress={onSubmit}
        activeOpacity={0.9}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={submitLabel}
        accessibilityState={{ busy, disabled: busy }}
      >
        {busy ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text variant="sectionTitle" style={styles.submitLabel}>
            {submitLabel}
          </Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() =>
          onModeChange(mode === 'sign_in' ? 'create' : 'sign_in')
        }
        disabled={busy}
        style={styles.switchHit}
        accessibilityRole="button"
        accessibilityLabel={switchLabel}
      >
        <Text variant="caption" style={{ color: theme.textSecondary }}>
          {switchLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing[2],
    marginTop: Spacing[3],
  },
  field: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    minHeight: 48,
    fontFamily: getFontFamilyForWeight(Weight.regular),
    fontSize: 16,
  },
  submit: {
    borderRadius: Radius.md,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[1],
  },
  submitLabel: {
    color: '#FFFFFF',
    fontFamily: getFontFamilyForWeight(Weight.semibold),
  },
  switchHit: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
});
