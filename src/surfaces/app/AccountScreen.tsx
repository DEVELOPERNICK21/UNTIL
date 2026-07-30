/**
 * Settings → Account — Google sign-in, device list, sign out.
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
} from 'react-native';
import { Text, ScreenGradient, GlassCard } from '../../ui';
import { useAuthSession, useAccountActions } from '../../hooks';
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

const DEVICE_LIMIT_BANNER_COPY =
  'This account is already used on 3 devices. Remove one to unlock premium here.';

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
    signInWithGoogle,
    signOut,
    removeDevice,
    refreshDevices,
    currentDeviceId,
    busy,
    error,
  } = useAccountActions();

  const [devices, setDevices] = useState<AccountDevice[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

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
        list.filter(d => d.active === true).sort((a, b) => b.lastSeenAt - a.lastSeenAt),
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

  const handleGoogleSignIn = async () => {
    void logAnalyticsEvent('account_screen_google_tapped');
    try {
      const result = await signInWithGoogle();
      if (!result) {
        void logAnalyticsEvent('account_screen_signin_cancelled');
        return;
      }
      void logAnalyticsEvent('account_screen_signin_succeeded');
      void loadDevices();
    } catch {
      void logAnalyticsEvent('account_screen_signin_failed');
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

  const handleRemoveDevice = (device: AccountDevice) => {
    Alert.alert(
      'Remove device',
      `Remove ${deviceLabel(device)}? It will need to sign in again to use premium.`,
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
                variant="caption"
                style={[styles.sectionLabel, { color: theme.textSecondary }]}
              >
                Account
              </Text>
              <GlassCard style={styles.introCard}>
                <Text
                  variant="title"
                  style={[styles.introTitle, { color: theme.textPrimary }]}
                >
                  Sign in to keep your data
                </Text>
                <Text
                  variant="body"
                  style={[styles.introBody, { color: theme.textSecondary }]}
                >
                  Saves DOB, premium, and settings across devices.
                </Text>
                {/*
                  Google is the only provider today. App Store guideline 4.8
                  requires an equivalent private login option alongside it, so
                  iOS needs Sign in with Apple here before submission.
                */}
                <TouchableOpacity
                  style={[styles.googleButton, styles.googleButtonBg]}
                  onPress={handleGoogleSignIn}
                  activeOpacity={0.85}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Google"
                >
                  {busy ? (
                    <ActivityIndicator color="#1A1A1A" />
                  ) : (
                    <>
                      <View style={styles.googleG}>
                        <Text style={styles.googleGText}>G</Text>
                      </View>
                      <Text
                        variant="sectionTitle"
                        style={styles.googleButtonLabel}
                      >
                        Continue with Google
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                {error ? (
                  <Text variant="caption" style={styles.errorText}>
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
                      <Text
                        variant="body"
                        style={{ color: theme.textPrimary }}
                      >
                        {email ?? 'Signed in'}
                      </Text>
                      <Text
                        variant="caption"
                        style={[
                          styles.rowSubtitle,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Google account
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
                            <Text
                              variant="caption"
                              style={styles.removeLabel}
                            >
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
                style={[styles.signOutButton, { borderColor: theme.glassBorder }]}
                onPress={handleSignOut}
                activeOpacity={0.7}
                disabled={busy}
              >
                <Text variant="body" style={{ color: theme.textSecondary }}>
                  Sign out
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </ScreenGradient>
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
    alignItems: 'center',
  },
  introTitle: {
    fontFamily: getFontFamilyForWeight(Weight.semibold),
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  introBody: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing[4],
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.md,
    minHeight: 52,
    width: '100%',
    gap: Spacing.sm,
    ...Shadows.card,
  },
  googleButtonBg: {
    backgroundColor: '#FFFFFF',
  },
  googleButtonLabel: {
    fontFamily: getFontFamilyForWeight(Weight.semibold),
    color: '#1A1A1A',
  },
  googleG: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleGText: {
    fontSize: 14,
    fontFamily: getFontFamilyForWeight(Weight.bold),
    color: '#FFFFFF',
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
});
