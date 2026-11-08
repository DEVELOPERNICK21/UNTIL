/**
 * Shared email + password fields for account sign-in / create.
 */

import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../../../shared/ui';
import {
  stripLinkMarkers,
  parseLinkedText,
} from '../../../shared/i18n/linkedText';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import {
  useTheme,
  Spacing,
  Radius,
  Weight,
  getFontFamilyForWeight,
} from '../../../shared/theme';

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
  /** Shows "Forgot password?" in sign-in mode. */
  onForgotPassword?: () => void;
  /** Confirmation under the form, e.g. after a reset email was requested. */
  notice?: string | null;
  /** Focus the email field as soon as the form appears. */
  autoFocus?: boolean;
  /** Spinner on the submit button; defaults to `busy`. */
  submitting?: boolean;
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
  onForgotPassword,
  notice,
  autoFocus = false,
  submitting = busy,
}: EmailPasswordAuthFormProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const passwordRef = useRef<TextInput>(null);
  const [showPassword, setShowPassword] = useState(false);
  const isCreate = mode === 'create';
  const submitLabel = isCreate
    ? t('account.form.create')
    : t('account.form.signIn');
  const switchMessage = t(
    isCreate ? 'account.form.haveAccount' : 'account.form.newHere',
  );

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
        {t('account.form.email')}
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
        autoFocus={autoFocus}
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => passwordRef.current?.focus()}
        editable={!busy}
        style={fieldStyle}
        accessibilityLabel={t('account.form.email')}
      />

      <View style={styles.passwordLabelRow}>
        <Text
          variant="caption"
          style={[
            styles.label,
            styles.passwordLabel,
            { color: theme.textSecondary },
          ]}
        >
          {t('account.password')}
        </Text>
        <TouchableOpacity
          onPress={() => setShowPassword(v => !v)}
          disabled={busy}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t(
            showPassword ? 'account.form.hideA11y' : 'account.form.showA11y',
          )}
        >
          <Text variant="caption" style={{ color: theme.textSecondary }}>
            {t(showPassword ? 'account.form.hide' : 'account.form.show')}
          </Text>
        </TouchableOpacity>
      </View>
      <TextInput
        ref={passwordRef}
        value={password}
        onChangeText={onPasswordChange}
        placeholder={t(
          isCreate
            ? 'account.form.passwordPlaceholderCreate'
            : 'account.form.passwordPlaceholder',
        )}
        placeholderTextColor={theme.textMuted}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType={isCreate ? 'newPassword' : 'password'}
        autoComplete={isCreate ? 'new-password' : 'current-password'}
        returnKeyType="go"
        editable={!busy}
        style={fieldStyle}
        accessibilityLabel={t('account.password')}
        onSubmitEditing={onSubmit}
      />

      {!isCreate && onForgotPassword ? (
        <TouchableOpacity
          onPress={onForgotPassword}
          disabled={busy}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.forgotHit}
          accessibilityRole="button"
          accessibilityLabel={t('account.form.forgotA11y')}
        >
          <Text variant="caption" style={{ color: theme.percent }}>
            {t('account.form.forgot')}
          </Text>
        </TouchableOpacity>
      ) : null}

      {notice ? (
        <Text
          variant="caption"
          accessibilityLiveRegion="polite"
          style={[styles.notice, { color: theme.textPrimary }]}
        >
          {notice}
        </Text>
      ) : null}

      <TouchableOpacity
        style={[styles.submit, { backgroundColor: theme.percent }]}
        onPress={onSubmit}
        activeOpacity={0.9}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={submitLabel}
        accessibilityState={{ busy, disabled: busy }}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text variant="sectionTitle" style={styles.submitLabel}>
            {submitLabel}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onModeChange(isCreate ? 'sign_in' : 'create')}
        disabled={busy}
        style={styles.switchHit}
        accessibilityRole="button"
        accessibilityLabel={stripLinkMarkers(switchMessage)}
      >
        <Text variant="caption" style={{ color: theme.textSecondary }}>
          {parseLinkedText(switchMessage).map((segment, index) =>
            segment.link ? (
              <Text
                key={index}
                variant="caption"
                style={[styles.switchAction, { color: theme.percent }]}
              >
                {segment.text}
              </Text>
            ) : (
              segment.text
            ),
          )}
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
  forgotHit: {
    alignSelf: 'flex-end',
    marginTop: -Spacing[1],
    paddingHorizontal: Spacing[1],
  },
  notice: {
    lineHeight: 18,
    paddingHorizontal: Spacing[1],
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
  switchAction: {
    fontFamily: getFontFamilyForWeight(Weight.semibold),
  },
});
