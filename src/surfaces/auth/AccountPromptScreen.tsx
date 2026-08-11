/**
 * Post-paywall soft account prompt — Google sign-in offered, skip allowed.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
  Animated,
  Pressable,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Text, ScreenGradient, GlassCard } from '../../ui';
import {
  useTheme,
  Spacing,
  Radius,
  Weight,
  getFontFamilyForWeight,
} from '../../theme';
import { appLogoIcon } from '../../assets/images';
import { useAccountActions } from '../../hooks';
import { useOnboardingComplete } from '../onboarding';
import { useEnter } from '../onboarding/onboardingMotion';
import { logAnalyticsEvent } from '../../services/analytics';
import {
  EmailPasswordAuthForm,
  type EmailAuthMode,
} from './EmailPasswordAuthForm';

const DEVICE_LIMIT_NOTE_MS = 2200;

const BENEFITS = [
  'DOB and life settings',
  'Premium on your phones',
  'Restore after reinstall',
] as const;

function GoogleMark({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityElementsHidden>
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

export function AccountPromptScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const completeAuth = useOnboardingComplete();
  const {
    signInWithGoogle,
    signInWithEmail,
    createAccountWithEmail,
    busy,
    error,
  } = useAccountActions();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deviceLimitNote, setDeviceLimitNote] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailMode, setEmailMode] = useState<EmailAuthMode>('sign_in');
  const isLight = theme.statusBarStyle === 'dark-content';

  const brandEnter = useEnter(true, 0);
  const copyEnter = useEnter(true, 80);
  const actionsEnter = useEnter(true, 160);

  useEffect(() => {
    void logAnalyticsEvent('account_prompt_shown');
  }, []);

  useEffect(() => {
    if (!deviceLimitNote) return;
    const timer = setTimeout(() => {
      completeAuth({
        exit_type: 'completed',
        step: 12,
        step_name: 'account_prompt_google',
      });
    }, DEVICE_LIMIT_NOTE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceLimitNote]);

  const finishSignedIn = (deviceLimitReached: boolean) => {
    if (deviceLimitReached) {
      setDeviceLimitNote(true);
      return;
    }
    completeAuth({
      exit_type: 'completed',
      step: 12,
      step_name: 'account_prompt_google',
    });
  };

  const handleGoogleSignIn = async () => {
    void logAnalyticsEvent('account_prompt_google_tapped');
    try {
      const result = await signInWithGoogle();
      if (!result) {
        void logAnalyticsEvent('account_prompt_signin_cancelled');
        return;
      }
      void logAnalyticsEvent('account_prompt_signin_succeeded', {
        device_limit_reached: result.deviceLimitReached,
        provider: 'google',
      });
      setConfirmVisible(false);
      finishSignedIn(result.deviceLimitReached);
    } catch {
      void logAnalyticsEvent('account_prompt_signin_failed', {
        provider: 'google',
      });
    }
  };

  const handleEmailSubmit = async () => {
    void logAnalyticsEvent('account_prompt_email_tapped', { mode: emailMode });
    try {
      const result =
        emailMode === 'sign_in'
          ? await signInWithEmail(email, password)
          : await createAccountWithEmail(email, password);
      void logAnalyticsEvent('account_prompt_signin_succeeded', {
        device_limit_reached: result.deviceLimitReached,
        provider: 'password',
        mode: emailMode,
      });
      setConfirmVisible(false);
      finishSignedIn(result.deviceLimitReached);
    } catch {
      void logAnalyticsEvent('account_prompt_signin_failed', {
        provider: 'password',
        mode: emailMode,
      });
    }
  };

  const handleSkipTap = () => {
    void logAnalyticsEvent('account_prompt_skip_tapped');
    setConfirmVisible(true);
  };

  const handleSkipConfirmed = () => {
    void logAnalyticsEvent('account_prompt_skip_confirmed');
    setConfirmVisible(false);
    completeAuth({
      exit_type: 'skipped',
      step: 12,
      step_name: 'account_prompt_skip',
    });
  };

  const handleSheetSignIn = () => {
    void logAnalyticsEvent('account_prompt_skip_cancelled');
    setConfirmVisible(false);
    void handleGoogleSignIn();
  };

  const handleSheetDismiss = () => {
    setConfirmVisible(false);
  };

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View
            style={[
              styles.content,
              { paddingBottom: Math.max(insets.bottom, Spacing[3]) },
            ]}
          >
            <Animated.View style={[styles.brandBlock, brandEnter]}>
              <Image
                source={appLogoIcon}
                style={styles.logoIcon}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
              <Text
                variant="sectionTitle"
                color="primary"
                style={styles.appTitle}
              >
                UNTIL
              </Text>
            </Animated.View>

            <Animated.View style={[styles.intro, copyEnter]}>
              <Text
                variant="display"
                color="primary"
                style={styles.headline}
              >
                {deviceLimitNote
                  ? 'Signed in'
                  : 'Keep your data with you'}
              </Text>
              <Text variant="body" color="secondary" style={styles.benefit}>
                {deviceLimitNote
                  ? 'Premium needs a free device slot. Manage devices in Settings → Account.'
                  : 'Saves DOB, premium, and settings across devices.'}
              </Text>

              {!deviceLimitNote ? (
                <View style={styles.benefitList}>
                  {BENEFITS.map(line => (
                    <View key={line} style={styles.benefitRow}>
                      <View
                        style={[
                          styles.benefitDot,
                          { backgroundColor: theme.percent },
                        ]}
                      />
                      <Text variant="body" color="secondary">
                        {line}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </Animated.View>

            <Animated.View style={[styles.actions, actionsEnter]}>
              {deviceLimitNote ? (
                <View style={styles.deviceLimitSpinnerWrap}>
                  <ActivityIndicator color={theme.textSecondary} />
                </View>
              ) : (
                <>
                  <GlassCard style={styles.actionsCard}>
                    {/*
                      Google is the only provider today. App Store guideline 4.8
                      requires an equivalent private login option alongside it, so
                      iOS needs Sign in with Apple here before submission.
                    */}
                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        {
                          backgroundColor: isLight ? '#FFFFFF' : '#F8F8F8',
                          borderColor: isLight
                            ? 'rgba(26,26,26,0.12)'
                            : 'transparent',
                        },
                      ]}
                      onPress={handleGoogleSignIn}
                      activeOpacity={0.85}
                      disabled={busy}
                      accessibilityRole="button"
                      accessibilityLabel="Continue with Google"
                      accessibilityState={{ busy, disabled: busy }}
                    >
                      {busy ? (
                        <ActivityIndicator color="#1A1A1A" />
                      ) : (
                        <>
                          <GoogleMark />
                          <Text
                            variant="sectionTitle"
                            style={styles.primaryButtonLabel}
                          >
                            Continue with Google
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <View style={styles.orRow}>
                      <View
                        style={[
                          styles.orLine,
                          { backgroundColor: theme.divider },
                        ]}
                      />
                      <Text
                        variant="caption"
                        style={{ color: theme.textMuted }}
                      >
                        or
                      </Text>
                      <View
                        style={[
                          styles.orLine,
                          { backgroundColor: theme.divider },
                        ]}
                      />
                    </View>

                    <EmailPasswordAuthForm
                      email={email}
                      password={password}
                      mode={emailMode}
                      busy={busy}
                      onEmailChange={setEmail}
                      onPasswordChange={setPassword}
                      onModeChange={setEmailMode}
                      onSubmit={() => {
                        void handleEmailSubmit();
                      }}
                    />

                    <Text
                      variant="caption"
                      style={[styles.trustLine, { color: theme.textMuted }]}
                    >
                      Up to 3 devices per account
                    </Text>
                  </GlassCard>

                  {error ? (
                    <Text variant="caption" style={styles.errorText}>
                      {error}
                    </Text>
                  ) : null}

                  <TouchableOpacity
                    onPress={handleSkipTap}
                    style={styles.skipHit}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityLabel="Continue without account"
                  >
                    <Text variant="caption" style={{ color: theme.textMuted }}>
                      Continue without account
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </Animated.View>
          </View>
        </SafeAreaView>
      </ScreenGradient>

      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleSheetDismiss}
      >
        <Pressable style={styles.backdrop} onPress={handleSheetDismiss}>
          <Pressable
            accessibilityRole="none"
            style={[
              styles.sheetCard,
              {
                backgroundColor: isLight
                  ? 'rgba(255,255,255,0.96)'
                  : 'rgba(40,40,46,0.94)',
                borderColor: isLight
                  ? 'rgba(26,26,26,0.08)'
                  : 'rgba(255,255,255,0.14)',
              },
            ]}
          >
            <Text variant="title" color="primary" style={styles.sheetTitle}>
              Without an account, data stays on this phone
            </Text>
            <Text variant="body" color="secondary" style={styles.sheetBody}>
              If you change phones or reinstall, DOB and premium may not come
              with you.
            </Text>
            <TouchableOpacity
              style={[styles.sheetPrimary, { backgroundColor: theme.percent }]}
              onPress={handleSheetSignIn}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Sign in to keep it"
            >
              <Text variant="sectionTitle" style={styles.sheetPrimaryLabel}>
                Sign in to keep it
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sheetSecondary}
              onPress={handleSkipConfirmed}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Continue anyway"
            >
              <Text variant="body" color="secondary">
                Continue anyway
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    justifyContent: 'space-between',
  },
  brandBlock: {
    alignItems: 'center',
    paddingTop: Spacing[2],
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
  },
  appTitle: {
    fontFamily: getFontFamilyForWeight(Weight.bold),
    letterSpacing: 1.2,
  },
  intro: {
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[1],
  },
  headline: {
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  benefit: {
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  benefitList: {
    marginTop: Spacing[3],
    alignSelf: 'center',
    width: '100%',
    maxWidth: 280,
    gap: Spacing[2],
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  benefitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  actions: {
    alignItems: 'stretch',
    paddingBottom: Spacing[2],
  },
  actionsCard: {
    padding: Spacing[3],
    gap: Spacing[2],
  },
  deviceLimitSpinnerWrap: {
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.md,
    minHeight: 52,
    gap: Spacing[2],
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  primaryButtonLabel: {
    fontFamily: getFontFamilyForWeight(Weight.semibold),
    color: '#1A1A1A',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginTop: Spacing[3],
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  trustLine: {
    textAlign: 'center',
    marginTop: Spacing[2],
  },
  errorText: {
    color: '#E85C5C',
    marginTop: Spacing[2],
    textAlign: 'center',
  },
  skipHit: {
    marginTop: Spacing[3],
    padding: Spacing.sm,
    alignSelf: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
    padding: Spacing[4],
    paddingBottom: Spacing[6],
  },
  sheetCard: {
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  sheetTitle: { marginBottom: Spacing[2], letterSpacing: -0.2 },
  sheetBody: { marginBottom: Spacing[4], lineHeight: 22 },
  sheetPrimary: {
    borderRadius: Radius.md,
    paddingVertical: Spacing[3],
    alignItems: 'center',
    marginBottom: Spacing[2],
    minHeight: 48,
    justifyContent: 'center',
  },
  sheetPrimaryLabel: { color: '#FFFFFF' },
  sheetSecondary: { alignItems: 'center', paddingVertical: Spacing[2] },
});
