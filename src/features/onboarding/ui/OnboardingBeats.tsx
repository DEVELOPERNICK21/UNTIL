/**
 * The question, interstitial and loader beats of the onboarding funnel, split from
 * OnboardingScreen so the screen keeps to navigation and step logic.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, Ember } from '../../../shared/ui';
import {
  useTheme,
  Spacing,
  Typography,
  Weight,
  getFontFamilyForWeight,
} from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useEnter } from './onboardingMotion';

export function QuestionLayout({
  title,
  emberProgress,
  children,
}: {
  title: string;
  emberProgress: number;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const titleEnter = useEnter(true, 40);
  const emberEnter = useEnter(true, 0);
  const bodyEnter = useEnter(true, 120);

  return (
    <View style={styles.questionBlock}>
      <Animated.View style={[styles.emberCenter, emberEnter]}>
        <Ember progress={emberProgress} size={56} />
      </Animated.View>
      <Animated.View style={titleEnter}>
        <Text
          variant="headline"
          accessibilityRole="header"
          style={[
            styles.questionTitle,
            {
              color: theme.textPrimary,
              fontFamily: getFontFamilyForWeight(Weight.bold),
            },
          ]}
        >
          {title}
        </Text>
      </Animated.View>
      <Animated.View style={bodyEnter}>{children}</Animated.View>
    </View>
  );
}

export function InterstitialBeat() {
  const { t } = useTranslation();
  const theme = useTheme();
  const title = useEnter(true, 60);
  const ember = useEnter(true, 0);

  return (
    <View style={styles.centerBlock}>
      <Animated.View style={ember}>
        <Ember progress={0.48} size={72} />
      </Animated.View>
      <Animated.View style={title}>
        <Text
          variant="headline"
          style={[
            styles.title,
            styles.statement,
            {
              color: theme.textPrimary,
              fontFamily: getFontFamilyForWeight(Weight.bold),
            },
          ]}
        >
          {t('onboarding.prompt.interstitial')}
        </Text>
      </Animated.View>
    </View>
  );
}

export function LoaderBeat() {
  const { t } = useTranslation();
  const theme = useTheme();
  const title = useEnter(true, 80);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.centerBlock}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Ember progress={0.62} size={80} />
      </Animated.View>
      <Animated.View style={title}>
        <Text
          variant="sectionTitle"
          style={[
            styles.title,
            {
              color: theme.textPrimary,
              marginTop: Spacing[4],
              fontFamily: getFontFamilyForWeight(Weight.semibold),
            },
          ]}
        >
          {t('onboarding.prompt.loaderTitle')}
        </Text>
        <Text
          variant="caption"
          style={{
            color: theme.textSecondary,
            textAlign: 'center',
            marginTop: Spacing[2],
          }}
        >
          {t('onboarding.prompt.loaderSub')}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerBlock: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing[4],
    paddingVertical: Spacing[6],
  },
  questionBlock: {
    gap: Spacing[3],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[4],
  },
  emberCenter: {
    alignItems: 'center',
    marginBottom: Spacing[1],
  },
  questionTitle: {
    textAlign: 'center',
    marginBottom: Spacing[3],
    lineHeight: Typography.headline * 1.25,
    paddingHorizontal: Spacing[2],
  },
  title: {
    textAlign: 'center',
  },
  statement: {
    lineHeight: Typography.headline * 1.3,
    maxWidth: 340,
  },
});
