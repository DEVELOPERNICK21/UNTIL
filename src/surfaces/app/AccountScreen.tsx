/**
 * Settings → Account — Apple (iOS) / Google / email sign-in, device list, sign out.
 * Signed out: CTA + short benefit line. Signed in: email, devices, sign out.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  TextInput,
} from 'react-native';
import {
  Text,
  ScreenGradient,
  GlassCard,
  AgeConfirmationCheck,
  LegalAgreementLine,
} from '../../ui';
import { LEGAL_URLS } from '../../config/monetization';
import {
  MINIMUM_ACCOUNT_AGE_YEARS,
  useAuthSession,
  useAccountActions,
} from '../../hooks';
import { isAuthRequiresPasswordError } from '../../domain/errors/authErrors';
import {
  useTheme,
  Spacing,
  Radius,
  Shadows,
  Weight,
  getFontFamilyForWeight,
} from '../../theme';
import type { AccountDevice } from '../../types';
import { logAnalyticsEvent } from '../../services/analytics';
import {
  EmailPasswordAuthForm,
  type EmailAuthMode,
} from '../auth/EmailPasswordAuthForm';
import { AppleSignInButton } from '../auth/AppleSignInButton';
import { GoogleMark } from '../auth/GoogleMark';

const DEVICE_LIMIT_BANNER_COPY =
  'This account is already used on 3 devices. Remove one to unlock premium here.';

const SIGN_IN_BENEFITS = [
  'Birth date and life settings',
  'Premium on up to 3 phones',
  'Restore after reinstall',
] as const;

function deviceLabel(device: AccountDevice): string {
  if (device.label) return device.label;
  const platform = device.platform === 'ios' ? 'iPhone' : 'Android phone';
  return `${platform} · ${device.id.slice(-4).toUpperCase()}`;
}

function formatLastSeen(timestampMs: number): string {
  const diffDays = Math.floor(
    (Date.now() - timestampMs) / (24 * 60 * 60 * 1000),
  );
  if (diffDays <= 0) return 'Active today';
  if (diffDays === 1) return 'Active yesterday';
  return `Active ${diffDays} days ago`;
}

export function AccountScreen() {
  const theme = useTheme();
  const { signedIn, email, devicePremiumAllowed } = useAuthSession();
  const {
    appleSignInAvailable,
    signInWithApple,
    signInWithGoogle,
    signInWithEmail,
    createAccountWithEmail,
    signOut,
    deleteAccount,
    removeDevice,
    refreshDevices,
    currentDeviceId,
    busy,
    error,
    clearError,
  } = useAccountActions();

  const [devices, setDevices] = useState<AccountDevice[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [emailMode, setEmailMode] = useState<EmailAuthMode>('sign_in');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [passwordForDelete, setPasswordForDelete] = useState('');
  const [passwordForDeleteVisible, setPasswordForDeleteVisible] =
    useState(false);
  const [passwordForDeleteError, setPasswordForDeleteError] = useState<
    string | null
  >(null);

  const loadDevices = useCallback(async () => {
    if (!signedIn) {
      setDevices([]);
      return;
    }
    setDevicesLoading(true);
    try {
      const list = await refreshDevices();
      /** Removed devices stay in Firestore for their history; only active ones hold a slot. */
      setDevices(
        list
          .filter(d => d.active === true)
          .sort((a, b) => b.lastSeenAt - a.lastSeenAt),
      );
    } catch {
      // Message is already surfaced via the hook's error state.
      setDevices([]);
    } finally {
      setDevicesLoading(false);
    }
  }, [signedIn, refreshDevices]);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  useEffect(() => {
    void logAnalyticsEvent('account_screen_viewed', { signed_in: signedIn });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAppleSignIn = async () => {
    void logAnalyticsEvent('account_screen_apple_tapped');
    try {
      const result = await signInWithApple(ageConfirmed);
      if (!result) {
        void logAnalyticsEvent('account_screen_signin_cancelled');
        return;
      }
      void logAnalyticsEvent('account_screen_signin_succeeded', {
        provider: 'apple',
      });
      void loadDevices();
    } catch {
      void logAnalyticsEvent('account_screen_signin_failed', {
        provider: 'apple',
      });
    }
  };

  const handleGoogleSignIn = async () => {
    void logAnalyticsEvent('account_screen_google_tapped');
    try {
      const result = await signInWithGoogle(ageConfirmed);
      if (!result) {
        void logAnalyticsEvent('account_screen_signin_cancelled');
        return;
      }
      void logAnalyticsEvent('account_screen_signin_succeeded', {
        provider: 'google',
      });
      void loadDevices();
    } catch {
      void logAnalyticsEvent('account_screen_signin_failed', {
        provider: 'google',
      });
    }
  };

  const handleEmailSubmit = async () => {
    void logAnalyticsEvent('account_screen_email_tapped', { mode: emailMode });
    try {
      if (emailMode === 'sign_in') {
        await signInWithEmail(authEmail, authPassword, ageConfirmed);
      } else {
        await createAccountWithEmail(authEmail, authPassword, ageConfirmed);
      }
      void logAnalyticsEvent('account_screen_signin_succeeded', {
        provider: 'password',
        mode: emailMode,
      });
      void loadDevices();
    } catch {
      void logAnalyticsEvent('account_screen_signin_failed', {
        provider: 'password',
        mode: emailMode,
      });
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'Your data on this device stays put.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void logAnalyticsEvent('account_screen_signout_confirmed');
          void signOut();
        },
      },
    ]);
  };

  const runDeleteAccount = async (emailPassword?: string) => {
    setPasswordForDeleteError(null);
    try {
      await deleteAccount(emailPassword);
      setPasswordForDelete('');
      setPasswordForDeleteError(null);
      setPasswordForDeleteVisible(false);
      void logAnalyticsEvent('account_deleted');
    } catch (e) {
      if (isAuthRequiresPasswordError(e)) {
        if (Platform.OS === 'ios') {
          Alert.prompt(
            'Confirm password',
            'Enter your password to delete your account.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: (password?: string) => {
                  if (!password) return;
                  void runDeleteAccount(password);
                },
              },
            ],
            'secure-text',
          );
          return;
        }
        setPasswordForDeleteError(null);
        setPasswordForDeleteVisible(true);
        return;
      }
      if (
        Platform.OS === 'android' &&
        (passwordForDeleteVisible || emailPassword !== undefined)
      ) {
        setPasswordForDeleteError(
          e instanceof Error && e.message
            ? e.message
            : 'Account not deleted. Try again.',
        );
        return;
      }
      Alert.alert('Account not deleted', 'Try again.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      `This removes your UNTIL account and cloud data. Progress on this phone stays. Purchases stay with your ${
        Platform.OS === 'ios' ? 'Apple ID' : 'Google Play account'
      }.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void logAnalyticsEvent('account_delete_started');
            void runDeleteAccount();
          },
        },
      ],
    );
  };

  const dismissPasswordForDelete = () => {
    setPasswordForDelete('');
    setPasswordForDeleteError(null);
    setPasswordForDeleteVisible(false);
    clearError();
  };

  const handleRemoveDevice = (device: AccountDevice) => {
    Alert.alert(
      'Remove device',
      `Remove ${deviceLabel(
        device,
      )}? It will need to sign in again to use premium.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemovingId(device.id);
            void logAnalyticsEvent('account_screen_device_removed');
            try {
              await removeDevice(device.id);
              await loadDevices();
            } catch {
              // Error message is already surfaced via the hook's error state.
            } finally {
              setRemovingId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Spacing[6] },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {!signedIn ? (
            <View style={styles.section}>
              <Text
                variant="display"
                style={[styles.introTitle, { color: theme.textPrimary }]}
              >
                Keep your data with you
              </Text>
              <Text
                variant="body"
                style={[styles.introBody, { color: theme.textSecondary }]}
              >
                Sync birth date, premium, and settings across phones.
              </Text>

              <View style={styles.benefitList}>
                {SIGN_IN_BENEFITS.map(line => (
                  <View key={line} style={styles.benefitRow}>
                    <View
                      style={[
                        styles.benefitDot,
                        { backgroundColor: theme.percent },
                      ]}
                    />
                    <Text variant="body" style={{ color: theme.textSecondary }}>
                      {line}
                    </Text>
                  </View>
                ))}
              </View>

              <GlassCard style={styles.introCard}>
                <AgeConfirmationCheck
                  checked={ageConfirmed}
                  onChange={setAgeConfirmed}
                  minimumAge={MINIMUM_ACCOUNT_AGE_YEARS}
                  disabled={busy}
                />
                <LegalAgreementLine
                  termsUrl={LEGAL_URLS.terms}
                  privacyUrl={LEGAL_URLS.privacy}
                />
                {/* App Store guideline 4.8: Apple must sit alongside Google on iOS. */}
                {appleSignInAvailable ? (
                  <AppleSignInButton
                    onPress={() => {
                      void handleAppleSignIn();
                    }}
                    busy={busy}
                  />
                ) : null}
                <TouchableOpacity
                  style={[
                    styles.googleButton,
                    {
                      backgroundColor: '#F8F8F8',
                      borderColor: theme.glassBorder,
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
                        style={styles.googleButtonLabel}
                      >
                        Continue with Google
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.orRow}>
                  <View
                    style={[styles.orLine, { backgroundColor: theme.divider }]}
                  />
                  <Text variant="caption" style={{ color: theme.textMuted }}>
                    or with email
                  </Text>
                  <View
                    style={[styles.orLine, { backgroundColor: theme.divider }]}
                  />
                </View>

                <EmailPasswordAuthForm
                  email={authEmail}
                  password={authPassword}
                  mode={emailMode}
                  busy={busy}
                  onEmailChange={setAuthEmail}
                  onPasswordChange={setAuthPassword}
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

                {error ? (
                  <Text
                    variant="caption"
                    style={[styles.errorText, styles.errorBelowForm]}
                  >
                    {error}
                  </Text>
                ) : null}
              </GlassCard>
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <Text
                  variant="caption"
                  style={[styles.sectionLabel, { color: theme.textSecondary }]}
                >
                  Account
                </Text>
                <GlassCard style={styles.sectionCard}>
                  <View style={[styles.row, styles.rowLast]}>
                    <View style={styles.rowContent}>
                      <Text variant="body" style={{ color: theme.textPrimary }}>
                        {email ?? 'Signed in'}
                      </Text>
                      <Text
                        variant="caption"
                        style={[
                          styles.rowSubtitle,
                          { color: theme.textSecondary },
                        ]}
                      >
                        UNTIL account
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </View>

              {!devicePremiumAllowed && (
                <GlassCard style={styles.bannerCard}>
                  <Text
                    variant="caption"
                    style={{ color: theme.textSecondary }}
                  >
                    {DEVICE_LIMIT_BANNER_COPY}
                  </Text>
                </GlassCard>
              )}

              <View style={styles.section}>
                <Text
                  variant="caption"
                  style={[styles.sectionLabel, { color: theme.textSecondary }]}
                >
                  Devices
                </Text>
                <GlassCard style={styles.sectionCard}>
                  {devicesLoading ? (
                    <View style={styles.devicesLoading}>
                      <ActivityIndicator color={theme.textSecondary} />
                    </View>
                  ) : devices.length === 0 ? (
                    <View style={[styles.row, styles.rowLast]}>
                      <Text
                        variant="caption"
                        style={{ color: theme.textSecondary }}
                      >
                        No devices yet.
                      </Text>
                    </View>
                  ) : (
                    devices.map((device, index) => (
                      <View
                        key={device.id}
                        style={[
                          styles.row,
                          index === devices.length - 1
                            ? styles.rowLast
                            : { borderBottomColor: theme.glassBorder },
                        ]}
                      >
                        <View style={styles.rowContent}>
                          <Text
                            variant="body"
                            style={{ color: theme.textPrimary }}
                          >
                            {deviceLabel(device)}
                            {device.id === currentDeviceId
                              ? ' · This device'
                              : ''}
                          </Text>
                          <Text
                            variant="caption"
                            style={[
                              styles.rowSubtitle,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {formatLastSeen(device.lastSeenAt)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemoveDevice(device)}
                          disabled={removingId === device.id}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          {removingId === device.id ? (
                            <ActivityIndicator color={theme.textSecondary} />
                          ) : (
                            <Text variant="caption" style={styles.removeLabel}>
                              Remove
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </GlassCard>
              </View>

              {error ? (
                <Text
                  variant="caption"
                  style={[styles.errorText, styles.errorTextSpacing]}
                >
                  {error}
                </Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.signOutButton,
                  { borderColor: theme.glassBorder },
                ]}
                onPress={handleSignOut}
                activeOpacity={0.7}
                disabled={busy}
              >
                <Text variant="body" style={{ color: theme.textSecondary }}>
                  Sign out
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  { borderColor: theme.glassBorder },
                ]}
                onPress={handleDeleteAccount}
                activeOpacity={0.7}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Delete account"
              >
                {busy ? (
                  <ActivityIndicator color="#C62828" />
                ) : (
                  <Text variant="body" style={{ color: '#C62828' }}>
                    Delete account
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </ScreenGradient>
      <Modal
        visible={passwordForDeleteVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={dismissPasswordForDelete}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.passwordModal,
              {
                backgroundColor: theme.cardBase,
                borderColor: theme.glassBorder,
              },
            ]}
          >
            <Text variant="title" style={{ color: theme.textPrimary }}>
              Confirm password
            </Text>
            <Text
              variant="body"
              style={[styles.passwordModalBody, { color: theme.textSecondary }]}
            >
              Enter your password to delete your account.
            </Text>
            <TextInput
              value={passwordForDelete}
              onChangeText={setPasswordForDelete}
              placeholder="Password"
              placeholderTextColor={theme.textMuted}
              secureTextEntry
              textContentType="password"
              autoComplete="password"
              autoFocus
              editable={!busy}
              style={[
                styles.passwordInput,
                {
                  color: theme.textPrimary,
                  borderColor: theme.glassBorder,
                },
              ]}
              accessibilityLabel="Password"
              onSubmitEditing={() => {
                if (passwordForDelete) {
                  void runDeleteAccount(passwordForDelete);
                }
              }}
            />
            {passwordForDeleteError ? (
              <Text
                variant="caption"
                style={[styles.errorText, styles.passwordModalError]}
              >
                {passwordForDeleteError}
              </Text>
            ) : null}
            <View style={styles.passwordModalActions}>
              <TouchableOpacity
                style={styles.passwordModalAction}
                onPress={dismissPasswordForDelete}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text variant="body" style={{ color: theme.textSecondary }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.passwordModalAction}
                onPress={() => {
                  void runDeleteAccount(passwordForDelete);
                }}
                disabled={busy || !passwordForDelete}
                accessibilityRole="button"
                accessibilityLabel="Delete"
              >
                <Text variant="body" style={{ color: '#C62828' }}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
  },
  section: {
    marginBottom: Spacing[4],
  },
  sectionLabel: {
    letterSpacing: 0.4,
    marginBottom: Spacing[2],
    marginLeft: Spacing[1],
  },
  sectionCard: {
    paddingVertical: Spacing[1],
    paddingHorizontal: Spacing[3],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowContent: {
    flex: 1,
  },
  rowSubtitle: {
    marginTop: 2,
  },
  introCard: {
    padding: Spacing[4],
    alignItems: 'stretch',
  },
  introTitle: {
    fontFamily: getFontFamilyForWeight(Weight.semibold),
    marginBottom: Spacing[2],
    letterSpacing: -0.4,
  },
  introBody: {
    lineHeight: 22,
    marginBottom: Spacing[3],
  },
  benefitList: {
    gap: Spacing[2],
    marginBottom: Spacing[4],
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
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 52,
    width: '100%',
    gap: Spacing.sm,
    ...Shadows.card,
  },
  googleButtonLabel: {
    fontFamily: getFontFamilyForWeight(Weight.semibold),
    color: '#1A1A1A',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginVertical: Spacing[3],
    width: '100%',
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  trustLine: {
    textAlign: 'center',
    marginTop: Spacing[3],
  },
  errorText: {
    color: '#E85C5C',
    textAlign: 'center',
  },
  errorBelowForm: {
    marginTop: Spacing[2],
  },
  errorTextSpacing: {
    marginBottom: Spacing[3],
  },
  bannerCard: {
    padding: Spacing[3],
    marginBottom: Spacing[4],
  },
  devicesLoading: {
    paddingVertical: Spacing[4],
    alignItems: 'center',
  },
  removeLabel: {
    color: '#E85C5C',
  },
  signOutButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  deleteButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingVertical: Spacing[3],
    alignItems: 'center',
    marginTop: Spacing[3],
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: Spacing[4],
  },
  passwordModal: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: Spacing[4],
  },
  passwordModalBody: {
    marginTop: Spacing[2],
    marginBottom: Spacing[3],
  },
  passwordInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    minHeight: 48,
    fontFamily: getFontFamilyForWeight(Weight.regular),
    fontSize: 16,
  },
  passwordModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing[2],
    marginTop: Spacing[3],
  },
  passwordModalError: {
    marginTop: Spacing[2],
  },
  passwordModalAction: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
  },
});
