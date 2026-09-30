/**
 * Post-paywall soft account prompt — Apple (iOS) / Google / email offered, skip allowed.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
  Animated,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  LayoutAnimation,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  Text,
  ScreenGradient,
  GlassCard,
  AgeConfirmationCheck,
  LegalAgreementLine,
  useReduceMotion,
} from '../../ui';
import { LEGAL_URLS } from '../../config/monetization';
import {
  useTheme,
  Spacing,
  Radius,
  Weight,
  getFontFamilyForWeight,
} from '../../theme';
import { appLogoIcon } from '../../assets/images';
import { MINIMUM_ACCOUNT_AGE_YEARS, useAccountActions } from '../../hooks';
import { useOnboardingComplete } from '../onboarding';
import { useEnter } from '../onboarding/onboardingMotion';
import { logAnalyticsEvent } from '../../services/analytics';
import {
  EmailPasswordAuthForm,
  type EmailAuthMode,
} from './EmailPasswordAuthForm';
import { AppleSignInButton } from './AppleSignInButton';
import { EmailMark } from './EmailMark';
import { GoogleMark } from './GoogleMark';

const DEVICE_LIMIT_NOTE_MS = 2200;

const BENEFITS = [
  'DOB and life settings',
  'Premium on up to 3 phones',
  'Restore after reinstall',
] as const;

type PendingProvider = 'apple' | 'google' | 'email' | null;

export function AccountPromptScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const completeAuth = useOnboardingComplete();
  const {
    appleSignInAvailable,
    signInWithApple,
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
  const [emailOpen, setEmailOpen] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [ageNudge, setAgeNudge] = useState(false);
  const [pending, setPending] = useState<PendingProvider>(null);
  const shakeX = useRef(new Animated.Value(0)).current;
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

  const handleAgeChange = (next: boolean) => {
    setAgeConfirmed(next);
    if (next) setAgeNudge(false);
  };

  /** Point at the age box instead of letting the use case reject the tap. */
  const ensureAgeConfirmed = (): boolean => {
    if (ageConfirmed) return true;
    setAgeNudge(true);
    AccessibilityInfo.announceForAccessibility(
      `Confirm you're ${MINIMUM_ACCOUNT_AGE_YEARS} or older first.`,
    );
    if (!reduceMotion) {
      shakeX.setValue(0);
      Animated.sequence(
        [8, -8, 6, -6, 3, 0].map(toValue =>
          Animated.timing(shakeX, {
            toValue,
            duration: 50,
            useNativeDriver: true,
          }),
        ),
      ).start();
    }
    return false;
  };

  const handleAppleSignIn = async () => {
    void logAnalyticsEvent('account_prompt_apple_tapped');
    if (!ensureAgeConfirmed()) return;
    setPending('apple');
    try {
      const result = await signInWithApple(ageConfirmed);
      if (!result) {
        void logAnalyticsEvent('account_prompt_signin_cancelled');
        return;
      }
      void logAnalyticsEvent('account_prompt_signin_succeeded', {
        device_limit_reached: result.deviceLimitReached,
        provider: 'apple',
      });
      setConfirmVisible(false);
      finishSignedIn(result.deviceLimitReached);
    } catch {
      void logAnalyticsEvent('account_prompt_signin_failed', {
        provider: 'apple',
      });
    } finally {
      setPending(null);
    }
  };

  const handleGoogleSignIn = async () => {
    void logAnalyticsEvent('account_prompt_google_tapped');
    if (!ensureAgeConfirmed()) return;
    setPending('google');
    try {
      const result = await signInWithGoogle(ageConfirmed);
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
    } finally {
      setPending(null);
    }
  };

  const handleEmailSubmit = async () => {
    void logAnalyticsEvent('account_prompt_email_tapped', { mode: emailMode });
    if (!ensureAgeConfirmed()) return;
    setPending('email');
    try {
      const result =
        emailMode === 'sign_in'
          ? await signInWithEmail(email, password, ageConfirmed)
          : await createAccountWithEmail(email, password, ageConfirmed);
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
    } finally {
      setPending(null);
    }
  };

  const openEmailForm = () => {
    if (!reduceMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setEmailOpen(true);
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
    void (appleSignInAvailable ? handleAppleSignIn() : handleGoogleSignIn());
  };

  const handleSheetDismiss = () => {
    setConfirmVisible(false);
  };

  const secondaryButtonColors = {
    backgroundColor: isLight ? '#FFFFFF' : '#F8F8F8',
    borderColor: isLight ? 'rgba(26,26,26,0.12)' : 'transparent',
  };

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            style={styles.safe}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={[
                styles.content,
                { paddingBottom: Math.max(insets.bottom, Spacing[3]) },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View>
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
                    {deviceLimitNote ? 'Signed in' : 'Keep your data with you'}
                  </Text>
                  {deviceLimitNote ? (
                    <Text
                      variant="body"
                      color="secondary"
                      style={styles.benefit}
                    >
                      Premium needs a free device slot. Manage devices in
                      Settings → Account.
                    </Text>
                  ) : (
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
                  )}
                </Animated.View>
              </View>

              <Animated.View style={[styles.actions, actionsEnter]}>
                {deviceLimitNote ? (
                  <View style={styles.deviceLimitSpinnerWrap}>
                    <ActivityIndicator color={theme.textSecondary} />
                  </View>
                ) : (
                  <>
                    <GlassCard style={styles.actionsCard}>
                      <Animated.View
                        style={{ transform: [{ translateX: shakeX }] }}
                      >
                        <AgeConfirmationCheck
                          checked={ageConfirmed}
                          onChange={handleAgeChange}
                          minimumAge={MINIMUM_ACCOUNT_AGE_YEARS}
                          disabled={busy}
                          attention={ageNudge}
                        />
                      </Animated.View>
                      {ageNudge && !ageConfirmed ? (
                        <Text
                          variant="caption"
                          style={[styles.ageHint, { color: theme.percent }]}
                        >
                          Tick this to continue.
                        </Text>
                      ) : null}

                      <View style={styles.providers}>
                        {/* App Store guideline 4.8: Apple must sit alongside Google on iOS. */}
                        {appleSignInAvailable ? (
                          <AppleSignInButton
                            onPress={() => {
                              void handleAppleSignIn();
                            }}
                            busy={pending === 'apple'}
                            disabled={busy}
                          />
                        ) : null}

                        <TouchableOpacity
                          style={[styles.providerButton, secondaryButtonColors]}
                          onPress={() => {
                            void handleGoogleSignIn();
                          }}
                          activeOpacity={0.85}
                          disabled={busy}
                          accessibilityRole="button"
                          accessibilityLabel="Continue with Google"
                          accessibilityState={{
                            busy: pending === 'google',
                            disabled: busy,
                          }}
                        >
                          {pending === 'google' ? (
                            <ActivityIndicator color="#1A1A1A" />
                          ) : (
                            <>
                              <GoogleMark />
                              <Text
                                variant="sectionTitle"
                                style={styles.providerLabel}
                              >
                                Continue with Google
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>

                        {emailOpen ? (
                          <View style={styles.emailForm}>
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
                                email
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
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={[
                              styles.providerButton,
                              styles.emailButton,
                              { borderColor: theme.glassBorder },
                            ]}
                            onPress={openEmailForm}
                            activeOpacity={0.7}
                            disabled={busy}
                            accessibilityRole="button"
                            accessibilityLabel="Continue with email"
                          >
                            <EmailMark color={theme.textPrimary} />
                            <Text
                              variant="sectionTitle"
                              style={[
                                styles.providerLabel,
                                { color: theme.textPrimary },
                              ]}
                            >
                              Continue with email
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {error ? (
                        <Text variant="caption" style={styles.errorText}>
                          {error}
                        </Text>
                      ) : null}

                      <View style={styles.legalWrap}>
                        <LegalAgreementLine
                          termsUrl={LEGAL_URLS.terms}
                          privacyUrl={LEGAL_URLS.privacy}
                          align="center"
                        />
                      </View>
                    </GlassCard>

                    <TouchableOpacity
                      onPress={handleSkipTap}
                      style={styles.skipHit}
                      disabled={busy}
                      accessibilityRole="button"
                      accessibilityLabel="Continue without account"
                    >
                      <Text
                        variant="caption"
                        style={{ color: theme.textMuted }}
                      >
                        Continue without account
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
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
    flexGrow: 1,
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    justifyContent: 'space-between',
    gap: Spacing[4],
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
    marginTop: Spacing[2],
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
    marginTop: Spacing[2],
    alignSelf: 'center',
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
  ageHint: {
    marginTop: -Spacing[1],
    marginLeft: 30,
  },
  providers: {
    gap: Spacing[2],
    marginTop: Spacing[1],
  },
  deviceLimitSpinnerWrap: {
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  providerButton: {
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
  emailButton: {
    backgroundColor: 'transparent',
  },
  providerLabel: {
    fontFamily: getFontFamilyForWeight(Weight.semibold),
    color: '#1A1A1A',
  },
  emailForm: {
    gap: Spacing[2],
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginTop: Spacing[2],
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  legalWrap: {
    marginTop: Spacing[1],
    paddingHorizontal: Spacing[2],
  },
  errorText: {
    color: '#E85C5C',
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
