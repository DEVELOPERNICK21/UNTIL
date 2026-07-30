/**
 * Post-paywall soft account prompt — Google sign-in offered, skip allowed.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Text, ScreenGradient } from '../../ui';
import {
  useTheme,
  Spacing,
  Radius,
  Shadows,
  Weight,
  getFontFamilyForWeight,
} from '../../theme';
import { useAccountActions } from '../../hooks';
import { useOnboardingComplete } from '../onboarding';
import { logAnalyticsEvent } from '../../services/analytics';

const DEVICE_LIMIT_NOTE_MS = 2200;

export function AccountPromptScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const completeAuth = useOnboardingComplete();
  const { signInWithGoogle, busy, error } = useAccountActions();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deviceLimitNote, setDeviceLimitNote] = useState(false);

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

  const handleGoogleSignIn = async () => {
    void logAnalyticsEvent('account_prompt_google_tapped');
    try {
      const result = await signInWithGoogle();
      void logAnalyticsEvent('account_prompt_signin_succeeded', {
        device_limit_reached: result.deviceLimitReached,
      });
      setConfirmVisible(false);
      if (result.deviceLimitReached) {
        setDeviceLimitNote(true);
        return;
      }
      completeAuth({
        exit_type: 'completed',
        step: 12,
        step_name: 'account_prompt_google',
      });
    } catch {
      void logAnalyticsEvent('account_prompt_signin_failed');
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
        <SafeAreaView style={styles.safe}>
          <View
            style={[
              styles.content,
              { paddingBottom: Math.max(insets.bottom, Spacing[3]) },
            ]}
          >
            <View style={styles.intro}>
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
            </View>

            <View style={styles.actions}>
              {deviceLimitNote ? (
                <View style={styles.deviceLimitSpinnerWrap}>
                  <ActivityIndicator color={theme.textSecondary} />
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.primaryButton, styles.primaryButtonBg]}
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
                          style={styles.primaryButtonLabel}
                        >
                          Continue with Google
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {error ? (
                    <Text
                      variant="caption"
                      style={styles.errorText}
                    >
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
            </View>
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
        <View style={styles.backdrop}>
          <View style={[styles.sheetCard, { backgroundColor: theme.cardBaseAlpha }]}>
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
          </View>
        </View>
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
    justifyContent: 'center',
  },
  intro: {
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[6],
  },
  headline: {
    textAlign: 'center',
  },
  benefit: {
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  actions: {
    alignItems: 'center',
  },
  deviceLimitSpinnerWrap: {
    paddingVertical: Spacing[3],
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.md,
    minHeight: 52,
    minWidth: 260,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  primaryButtonBg: {
    backgroundColor: '#FFFFFF',
  },
  primaryButtonLabel: {
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
    marginTop: Spacing[2],
    textAlign: 'center',
  },
  skipHit: {
    marginTop: Spacing[4],
    padding: Spacing.sm,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    padding: Spacing[4],
  },
  sheetCard: { borderRadius: Radius.lg, padding: Spacing[4] },
  sheetTitle: { marginBottom: Spacing[2] },
  sheetBody: { marginBottom: Spacing[4], lineHeight: 22 },
  sheetPrimary: {
    borderRadius: Radius.md,
    paddingVertical: Spacing[3],
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  sheetPrimaryLabel: { color: '#FFFFFF' },
  sheetSecondary: { alignItems: 'center', paddingVertical: Spacing[2] },
});
