/**
 * Settings → Account — Apple (iOS) / Google / email sign-in, device list, sign out.
 * Signed out: CTA + short benefit line. Signed in: email, devices, sign out.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { Text, ScreenGradient, GlassCard } from '../../../shared/ui';
import { useAuthSession } from '../hooks/useAuthSession';
import { useAccountActions } from '../hooks/useAccountActions';
import { isAuthRequiresPasswordError, describeAuthFailure } from '../domain/authErrors';
import {
  useTheme,
  Spacing,
  Radius,
  Weight,
  getFontFamilyForWeight,
} from '../../../shared/theme';
import type { AccountDevice } from '../../../shared/types';
import { logAnalyticsEvent } from '../../../shared/analytics/analytics';
import { promptDesktopDownload } from '../../../shared/desktopDownload';
import type { EmailAuthMode } from './EmailPasswordAuthForm';
import { SignInOptions } from './SignInOptions';
import { AccountDevicesSection } from './AccountDevicesSection';
import {
  desktopSlotNote,
  deviceLimitBannerCopy,
  formatAccountDeviceLabel,
  signInBenefits,
} from '../domain/accountCopy';
import { useTranslation } from '../../../shared/i18n/useTranslation';

/** Keeps the last line clear of the Ember companion that floats over the bottom-right corner. */
const EMBER_CLEARANCE = 72;

export function AccountScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { signedIn, email, devicePremiumAllowed } = useAuthSession();
  const {
    appleSignInAvailable,
    signInWithApple,
    signInWithGoogle,
    signInWithEmail,
    createAccountWithEmail,
    sendPasswordReset,
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
  const [devicesNow, setDevicesNow] = useState(() => Date.now());
  const [removingId, setRemovingId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
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
      /** Removed devices stay in Firestore for their history; only active ones are listed. */
      setDevices(list.filter(d => d.active === true));
      setDevicesNow(Date.now());
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

  const handleAppleSignIn = async (ageConfirmed: boolean) => {
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
    } catch (e) {
      void logAnalyticsEvent('account_screen_signin_failed', {
        ...describeAuthFailure(e),
        provider: 'apple',
      });
    }
  };

  const handleGoogleSignIn = async (ageConfirmed: boolean) => {
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
    } catch (e) {
      void logAnalyticsEvent('account_screen_signin_failed', {
        ...describeAuthFailure(e),
        provider: 'google',
      });
    }
  };

  const handleEmailSubmit = async (
    mode: EmailAuthMode,
    authEmail: string,
    authPassword: string,
    ageConfirmed: boolean,
  ) => {
    void logAnalyticsEvent('account_screen_email_tapped', { mode });
    try {
      if (mode === 'sign_in') {
        await signInWithEmail(authEmail, authPassword, ageConfirmed);
      } else {
        await createAccountWithEmail(authEmail, authPassword, ageConfirmed);
      }
      void logAnalyticsEvent('account_screen_signin_succeeded', {
        provider: 'password',
        mode,
      });
      void loadDevices();
    } catch (e) {
      void logAnalyticsEvent('account_screen_signin_failed', {
        ...describeAuthFailure(e),
        provider: 'password',
        mode,
      });
    }
  };

  const handleForgotPassword = async (authEmail: string): Promise<boolean> => {
    try {
      await sendPasswordReset(authEmail);
      void logAnalyticsEvent('account_screen_password_reset_requested');
      return true;
    } catch (e) {
      void logAnalyticsEvent('account_screen_password_reset_failed', {
        ...describeAuthFailure(e),
      });
      return false;
    }
  };

  /** Lets the email form open and the keyboard settle, then brings the form into view. */
  const scrollToEnd = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
  };

  const handleSignOut = () => {
    Alert.alert(t('account.signOutTitle'), t('account.signOutBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('account.signOut'),
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
            t('account.passwordConfirm.title'),
            t('account.error.enterPasswordToDelete'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('account.delete'),
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
            : t('account.deleteFailed.inline'),
        );
        return;
      }
      Alert.alert(
        t('account.deleteFailed.title'),
        t('account.deleteFailed.body'),
      );
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('account.deleteTitle'),
      t(
        Platform.OS === 'ios'
          ? 'account.deleteBody.ios'
          : 'account.deleteBody.android',
      ),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('account.delete'),
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
      t('account.removeDevice.title'),
      t('account.removeDevice.body', { device: formatAccountDeviceLabel(device) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
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
          ref={scrollRef}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Spacing[6] + EMBER_CLEARANCE },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          {!signedIn ? (
            <View style={styles.section}>
              <Text
                variant="display"
                style={[styles.introTitle, { color: theme.textPrimary }]}
              >
                {t('account.intro.title')}
              </Text>
              <Text
                variant="body"
                style={[styles.introBody, { color: theme.textSecondary }]}
              >
                {t('account.intro.body')}
              </Text>

              <View style={styles.benefitList}>
                {signInBenefits().map(line => (
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
                <SignInOptions
                  appleSignInAvailable={appleSignInAvailable}
                  busy={busy}
                  error={error}
                  onApple={handleAppleSignIn}
                  onGoogle={handleGoogleSignIn}
                  onEmail={handleEmailSubmit}
                  onForgotPassword={handleForgotPassword}
                  onClearError={clearError}
                  onAgeGateBlocked={provider => {
                    void logAnalyticsEvent('account_screen_age_gate_blocked', {
                      provider,
                    });
                  }}
                  onEmailOpened={scrollToEnd}
                />
              </GlassCard>
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <Text
                  variant="caption"
                  style={[styles.sectionLabel, { color: theme.textSecondary }]}
                >
                  {t('account.sectionTitle')}
                </Text>
                <GlassCard style={styles.sectionCard}>
                  <View style={[styles.row, styles.rowLast]}>
                    <View style={styles.rowContent}>
                      <Text variant="body" style={{ color: theme.textPrimary }}>
                        {email ?? t('account.signedIn')}
                      </Text>
                      <Text
                        variant="caption"
                        style={[
                          styles.rowSubtitle,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {t('account.untilAccount')}
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
                    {deviceLimitBannerCopy()}
                  </Text>
                </GlassCard>
              )}

              <AccountDevicesSection
                devices={devices}
                currentDeviceId={currentDeviceId}
                loading={devicesLoading}
                removingId={removingId}
                now={devicesNow}
                onRemove={handleRemoveDevice}
              />

              <TouchableOpacity
                style={[
                  styles.desktopRow,
                  { borderColor: theme.glassBorder },
                ]}
                onPress={promptDesktopDownload}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('account.desktop.a11y')}
              >
                <View style={styles.rowContent}>
                  <Text variant="body" style={{ color: theme.textPrimary }}>
                    {t('account.desktop.title')}
                  </Text>
                  <Text
                    variant="caption"
                    style={[
                      styles.rowSubtitle,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {desktopSlotNote()}
                  </Text>
                </View>
                <Text style={[styles.chevron, { color: theme.textSecondary }]}>
                  ›
                </Text>
              </TouchableOpacity>

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
                  {t('account.signOut')}
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
                accessibilityLabel={t('account.deleteAccount')}
              >
                {busy ? (
                  <ActivityIndicator color="#C62828" />
                ) : (
                  <Text variant="body" style={{ color: '#C62828' }}>
                    {t('account.deleteAccount')}
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
              {t('account.passwordConfirm.title')}
            </Text>
            <Text
              variant="body"
              style={[styles.passwordModalBody, { color: theme.textSecondary }]}
            >
              {t('account.error.enterPasswordToDelete')}
            </Text>
            <TextInput
              value={passwordForDelete}
              onChangeText={setPasswordForDelete}
              placeholder={t('account.password')}
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
              accessibilityLabel={t('account.password')}
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
                accessibilityLabel={t('common.cancel')}
              >
                <Text variant="body" style={{ color: theme.textSecondary }}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.passwordModalAction}
                onPress={() => {
                  void runDeleteAccount(passwordForDelete);
                }}
                disabled={busy || !passwordForDelete}
                accessibilityRole="button"
                accessibilityLabel={t('account.delete')}
              >
                <Text variant="body" style={{ color: '#C62828' }}>
                  {t('account.delete')}
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
  desktopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing[4],
  },
  chevron: {
    fontSize: 22,
    marginLeft: Spacing[2],
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
  errorText: {
    color: '#E85C5C',
    textAlign: 'center',
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
