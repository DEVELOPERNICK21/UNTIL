/**
 * Signed-out sign-in panel for the Account screen: age confirmation, Apple (iOS) / Google / email,
 * inline errors and the legal line. Presentational: it owns the form state, the parent runs the
 * sign-in and reports back, so analytics and navigation stay in the screen.
 */

import React, { useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AgeConfirmationCheck,
  LegalAgreementLine,
  Text,
  useReduceMotion,
} from '../../../shared/ui';
import { LEGAL_URLS } from '../../../config/monetization';
import {
  Radius,
  Spacing,
  Weight,
  getFontFamilyForWeight,
  useTheme,
} from '../../../shared/theme';
import { MINIMUM_ACCOUNT_AGE_YEARS } from '../hooks/useAccountActions';
import { useAgeConfirmation } from '../hooks/useAgeConfirmation';
import { AppleSignInButton } from './AppleSignInButton';
import { GoogleSignInButton } from './GoogleSignInButton';
import { EmailMark } from './EmailMark';
import {
  EmailPasswordAuthForm,
  type EmailAuthMode,
} from './EmailPasswordAuthForm';

type SignInProvider = 'apple' | 'google' | 'email';
type PendingProvider = SignInProvider | 'reset' | null;

interface SignInOptionsProps {
  appleSignInAvailable: boolean;
  /** Any account action is running, so every control is locked. */
  busy: boolean;
  /** Message from the last failed action. */
  error: string | null;
  onApple: (ageConfirmed: boolean) => Promise<void>;
  onGoogle: (ageConfirmed: boolean) => Promise<void>;
  onEmail: (
    mode: EmailAuthMode,
    email: string,
    password: string,
    ageConfirmed: boolean,
  ) => Promise<void>;
  /** Resolves true when the reset email was requested. */
  onForgotPassword: (email: string) => Promise<boolean>;
  onClearError: () => void;
  /** The person tapped a sign-in button before confirming their age. */
  onAgeGateBlocked?: (provider: SignInProvider) => void;
  /** The email form just opened, so the parent can scroll it into view. */
  onEmailOpened?: () => void;
}

export function SignInOptions({
  appleSignInAvailable,
  busy,
  error,
  onApple,
  onGoogle,
  onEmail,
  onForgotPassword,
  onClearError,
  onAgeGateBlocked,
  onEmailOpened,
}: SignInOptionsProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const age = useAgeConfirmation<SignInProvider>(onAgeGateBlocked);
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<EmailAuthMode>('sign_in');
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingProvider>(null);

  const run = async (
    provider: Exclude<PendingProvider, null>,
    action: () => Promise<unknown>,
  ) => {
    setPending(provider);
    try {
      await action();
    } finally {
      setPending(null);
    }
  };

  const openEmailForm = () => {
    if (!reduceMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setEmailOpen(true);
    onEmailOpened?.();
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setResetNotice(null);
    if (error) onClearError();
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (error) onClearError();
  };

  const handleModeChange = (next: EmailAuthMode) => {
    setMode(next);
    setResetNotice(null);
    onClearError();
  };

  const handleEmailSubmit = () => {
    if (!age.ensureConfirmed('email')) return;
    setResetNotice(null);
    void run('email', () => onEmail(mode, email, password, age.confirmed));
  };

  const handleForgotPassword = () => {
    setResetNotice(null);
    void run('reset', async () => {
      const sent = await onForgotPassword(email);
      if (sent) {
        setResetNotice(
          'If that email has an account, a reset link is on its way. Check your spam folder too.',
        );
      }
    });
  };

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ transform: [{ translateX: age.shakeX }] }}>
        <AgeConfirmationCheck
          checked={age.confirmed}
          onChange={age.setConfirmed}
          minimumAge={MINIMUM_ACCOUNT_AGE_YEARS}
          disabled={busy}
          attention={age.nudge}
        />
      </Animated.View>

      <View style={styles.providers}>
        {/* App Store guideline 4.8: Apple must sit alongside Google on iOS. */}
        {appleSignInAvailable ? (
          <AppleSignInButton
            onPress={() => {
              if (age.ensureConfirmed('apple')) {
                void run('apple', () => onApple(age.confirmed));
              }
            }}
            busy={pending === 'apple'}
            disabled={busy}
          />
        ) : null}

        <GoogleSignInButton
          onPress={() => {
            if (age.ensureConfirmed('google')) {
              void run('google', () => onGoogle(age.confirmed));
            }
          }}
          busy={pending === 'google'}
          disabled={busy}
        />

        {emailOpen ? (
          <View style={styles.emailForm}>
            <View style={styles.dividerRow}>
              <View
                style={[styles.dividerLine, { backgroundColor: theme.divider }]}
              />
              <Text variant="caption" style={{ color: theme.textMuted }}>
                email
              </Text>
              <View
                style={[styles.dividerLine, { backgroundColor: theme.divider }]}
              />
            </View>
            <EmailPasswordAuthForm
              email={email}
              password={password}
              mode={mode}
              busy={busy}
              autoFocus
              submitting={pending === 'email'}
              notice={resetNotice}
              onEmailChange={handleEmailChange}
              onPasswordChange={handlePasswordChange}
              onModeChange={handleModeChange}
              onSubmit={handleEmailSubmit}
              onForgotPassword={handleForgotPassword}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.emailButton, { borderColor: theme.glassBorder }]}
            onPress={openEmailForm}
            activeOpacity={0.7}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Continue with email"
          >
            <EmailMark color={theme.textPrimary} />
            <Text
              variant="sectionTitle"
              style={[styles.emailLabel, { color: theme.textPrimary }]}
            >
              Continue with email
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text
          variant="caption"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={styles.errorText}
        >
          {error}
        </Text>
      ) : null}

      <LegalAgreementLine
        termsUrl={LEGAL_URLS.terms}
        privacyUrl={LEGAL_URLS.privacy}
        align="center"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing[3],
  },
  providers: {
    gap: Spacing[2],
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    minHeight: 52,
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  emailLabel: {
    fontFamily: getFontFamilyForWeight(Weight.semibold),
  },
  emailForm: {
    gap: Spacing[2],
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginTop: Spacing[2],
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  errorText: {
    color: '#E85C5C',
    textAlign: 'center',
    lineHeight: 18,
  },
});
