/**
 * Login / Welcome screen — matches app UI: ScreenGradient, Card, Typography, theme.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Text, ScreenGradient, Card } from '../../ui';
import {
  useTheme,
  Spacing,
  Radius,
  Typography,
  Weight,
  getFontFamilyForWeight,
  FontFamily,
  Shadows,
} from '../../theme';
import { appLogoIcon } from '../../assets/images';
import { useOnboardingComplete } from '../onboarding';

const STAGGER_MS = 60;

/** Subtle glow on accent word — minimal, not overpowering */
function accentGlowStyle(hexColor: string) {
  return {
    color: hexColor,
    textShadowColor: hexColor,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  };
}

export function LoginScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const completeAuth = useOnboardingComplete();
  const percent = theme.percent;

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const welcomeOpacity = useRef(new Animated.Value(0)).current;
  const welcomeTranslate = useRef(new Animated.Value(12)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(16)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(logoOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.delay(120),
      Animated.parallel([
        Animated.timing(welcomeOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(welcomeTranslate, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslate, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
      Animated.sequence([
        Animated.delay(STAGGER_MS),
        Animated.timing(footerOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [
    logoOpacity,
    welcomeOpacity,
    welcomeTranslate,
    cardOpacity,
    cardTranslate,
    footerOpacity,
  ]);

  const handleContinue = () => {
    completeAuth();
  };

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <SafeAreaView style={styles.safe}>
          <View
            style={[
              styles.wrapper,
              { paddingBottom: Math.max(insets.bottom, Spacing[3]) },
            ]}
          >
            {/* Brand — same as app header feel */}
            <Animated.View
              style={[styles.brandBlock, { opacity: logoOpacity }]}
            >
              <Image
                source={appLogoIcon}
                style={styles.logoIcon}
                resizeMode="contain"
              />
              <Text
                variant="sectionTitle"
                color="primary"
                style={styles.appTitle}
              >
                UNTIL
              </Text>
            </Animated.View>

            {/* Headline — world-class minimal hierarchy: one strong line, one accent line */}
            <Animated.View
              style={[
                styles.headlineWrap,
                {
                  opacity: welcomeOpacity,
                  transform: [{ translateY: welcomeTranslate }],
                },
              ]}
            >
              <Text color="primary" style={styles.headlineLine1}>
                Welcome back
              </Text>
              <Text color="primary" style={styles.headlineLine2}>
                to the{' '}
                <Text
                  style={[accentGlowStyle(percent), styles.headlineAccentWord]}
                >
                  PRESENT...
                </Text>
              </Text>
            </Animated.View>

            {/* Actions — Card same as Settings/Profile sections */}
            <Animated.View
              style={[
                styles.cardWrap,
                {
                  opacity: cardOpacity,
                  transform: [{ translateY: cardTranslate }],
                },
              ]}
            >
              <Card style={styles.actionsCard}>
                <TouchableOpacity
                  style={[styles.primaryButton, styles.primaryButtonBg]}
                  onPress={handleContinue}
                  activeOpacity={0.8}
                >
                  <View style={styles.googleG}>
                    <Text style={styles.googleGText}>G</Text>
                  </View>
                  <Text
                    variant="sectionTitle"
                    style={styles.primaryButtonLabel}
                  >
                    CONTINUE WITH GOOGLE
                  </Text>
                </TouchableOpacity>

                <View style={styles.orRow}>
                  <View
                    style={[styles.orLine, { backgroundColor: theme.divider }]}
                  />
                  <Text variant="caption" color="secondary">
                    OR
                  </Text>
                  <View
                    style={[styles.orLine, { backgroundColor: theme.divider }]}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.outlineButton,
                    { borderColor: theme.glassBorder },
                  ]}
                  onPress={handleContinue}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.outlineIcon, { color: theme.textPrimary }]}
                  >
                    ✉
                  </Text>
                  <Text
                    variant="sectionTitle"
                    color="primary"
                    style={styles.outlineButtonLabel}
                  >
                    CONTINUE WITH EMAIL
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.outlineButton,
                    { borderColor: theme.glassBorder },
                  ]}
                  onPress={handleContinue}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.outlineIcon, { color: theme.textPrimary }]}
                  >
                    📱
                  </Text>
                  <Text
                    variant="sectionTitle"
                    color="primary"
                    style={styles.outlineButtonLabel}
                  >
                    CONTINUE WITH PHONE
                  </Text>
                </TouchableOpacity>
              </Card>

              <Animated.View
                style={[styles.footerBlock, { opacity: footerOpacity }]}
              >
                <Text variant="body" color="secondary">
                  New to the collective?
                </Text>
                <TouchableOpacity
                  onPress={handleContinue}
                  style={styles.createAccountHit}
                >
                  <Text
                    variant="sectionTitle"
                    style={[styles.createAccountLink, { color: percent }]}
                  >
                    CREATE AN ACCOUNT
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </View>
        </SafeAreaView>
      </ScreenGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
    paddingHorizontal: Spacing[3],
    paddingTop: Spacing[3],
    justifyContent: 'space-between',
  },
  brandBlock: {
    alignItems: 'center',
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
  },
  appTitle: {
    fontFamily: getFontFamilyForWeight(Weight.bold),
    letterSpacing: 1,
  },
  headlineWrap: {
    // flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // paddingVertical: Spacing[4],
    // paddingHorizontal: Spacing[1],
  },
  headlineLine1: {
    fontSize: 34,
    fontFamily: getFontFamilyForWeight(Weight.medium),
    letterSpacing: 0.5,
    lineHeight: 40,
    marginBottom: Spacing.sm,
  },
  headlineLine2: {
    fontSize: 28,
    fontFamily: getFontFamilyForWeight(Weight.regular),
    letterSpacing: 0.3,
    lineHeight: 36,
  },
  headlineAccentWord: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
  },
  cardWrap: {
    paddingTop: Spacing.sm,
  },
  actionsCard: {
    padding: Spacing[3],
    marginBottom: Spacing[3],
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.md,
    minHeight: 52,
    gap: Spacing.sm,
    marginBottom: Spacing[3],
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
    fontSize: Typography.subtitle,
    fontFamily: getFontFamilyForWeight(Weight.bold),
    color: '#FFFFFF',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing[3],
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
    minHeight: 52,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  outlineIcon: {
    fontSize: Typography.body,
  },
  outlineButtonLabel: {
    fontFamily: getFontFamilyForWeight(Weight.medium),
  },
  footerBlock: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  createAccountHit: {
    padding: Spacing.sm,
  },
  createAccountLink: {
    fontFamily: getFontFamilyForWeight(Weight.semibold),
    textDecorationLine: 'underline',
  },
});
