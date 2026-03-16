/**
 * Splash screen — premium minimal UI.
 * Uses theme SplashColors (SSOT). Shown at app load; duration controlled by parent.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  useWindowDimensions,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../ui';
import { SplashColors, Spacing, Typography, FontFamily, Radius } from '../../theme';
import { appLogoIcon } from '../../assets/images';

const PROGRESS_TARGET = 0.38;
const APP_ICON_SIZE = 96;

interface SplashScreenProps {
  /** Duration in ms for progress animation; should match parent show duration for consistency */
  durationMs?: number;
}

export function SplashScreen({ durationMs = 1000 }: SplashScreenProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const barWidth = Math.min(280, width - Spacing.lg * 2);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: PROGRESS_TARGET,
      duration: durationMs,
      useNativeDriver: false,
    }).start();
  }, [progress, durationMs]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={SplashColors.background} />
      <View style={styles.centered}>
        <Image
          source={appLogoIcon}
          style={styles.appIcon}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: SplashColors.textPrimary }]}>
          UNTIL
        </Text>
        <Text style={[styles.tagline, { color: SplashColors.textSecondary }]}>
          THE FUTURE IS NOW
        </Text>
        <Text style={[styles.keywords, { color: SplashColors.textMuted }]}>
          PREMIUM · MINIMAL · TIMELESS
        </Text>
      </View>

      <View style={[styles.footerSection, { width: barWidth }]}>
        <Text style={[styles.initializing, { color: SplashColors.textMuted }]}>
          INITIALIZING
        </Text>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressWidth,
              },
            ]}
          />
        </View>
        <Text style={styles.percent}>38%</Text>
        <Text style={[styles.footerLine, { color: SplashColors.footer }]}>
          DESIGNED FOR EXCELLENCE
        </Text>
        <View style={styles.dots}>
          <View
            style={[styles.dot, { backgroundColor: SplashColors.footer }]}
          />
          <View
            style={[styles.dot, { backgroundColor: SplashColors.footer }]}
          />
          <View
            style={[styles.dot, { backgroundColor: SplashColors.footer }]}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SplashColors.background,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appIcon: {
    width: APP_ICON_SIZE,
    height: APP_ICON_SIZE,
    borderRadius: Radius.lg,
  },
  title: {
    fontSize: Typography.headline,
    fontFamily: FontFamily.medium,
    letterSpacing: 2,
    marginTop: Spacing.lg,
  },
  tagline: {
    fontSize: Typography.caption,
    fontFamily: FontFamily.regular,
    letterSpacing: 1,
    marginTop: Spacing.sm,
  },
  keywords: {
    fontSize: Typography.small,
    fontFamily: FontFamily.regular,
    letterSpacing: 1,
    marginTop: Spacing.md,
  },
  footerSection: {
    alignItems: 'stretch',
    paddingHorizontal: Spacing.sm,
  },
  initializing: {
    fontSize: Typography.small,
    fontFamily: FontFamily.regular,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: SplashColors.progressTrack,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: SplashColors.progressFill,
    borderRadius: 2,
  },
  percent: {
    fontSize: Typography.small,
    fontFamily: FontFamily.regular,
    color: SplashColors.accent,
    alignSelf: 'flex-end',
    marginBottom: Spacing.xl,
  },
  footerLine: {
    fontSize: Typography.badge,
    fontFamily: FontFamily.regular,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
