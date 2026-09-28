/**
 * Shared email + password fields for account sign-in / create.
 */

import React, { useState } from 'react';
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
  const [showPassword, setShowPassword] = useState(false);
  const submitLabel = mode === 'sign_in' ? 'Sign in' : 'Create account';
  const switchLabel =
    mode === 'sign_in' ? 'New here? Create an account' : 'Have an account? Sign in';

  const fieldStyle = [
    styles.field,
    {
      color: theme.textPrimary,
      backgroundColor: theme.glassHighlight,
      borderColor: theme.glassBorder,
    },
  ];

  return (
    <View style={styles.wrap}>
      <Text
        variant="caption"
        style={[styles.label, { color: theme.textSecondary }]}
      >
        Email
      </Text>
      <TextInput
        value={email}
        onChangeText={onEmailChange}
        placeholder="you@email.com"
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

      <View style={styles.passwordLabelRow}>
        <Text
          variant="caption"
          style={[styles.label, styles.passwordLabel, { color: theme.textSecondary }]}
        >
          Password
        </Text>
        <TouchableOpacity
          onPress={() => setShowPassword(v => !v)}
          disabled={busy}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
        >
          <Text variant="caption" style={{ color: theme.textMuted }}>
            {showPassword ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
      </View>
      <TextInput
        value={password}
        onChangeText={onPasswordChange}
        placeholder="At least 6 characters"
        placeholderTextColor={theme.textMuted}
        secureTextEntry={!showPassword}
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
        onPress={() => onModeChange(mode === 'sign_in' ? 'create' : 'sign_in')}
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
    width: '100%',
  },
  label: {
    marginBottom: -Spacing[1],
    marginLeft: Spacing[1],
  },
  passwordLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing[1],
    paddingHorizontal: Spacing[1],
  },
  passwordLabel: {
    marginBottom: 0,
    marginLeft: 0,
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
    marginTop: Spacing[2],
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
