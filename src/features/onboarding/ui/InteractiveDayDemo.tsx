/**
 * Interactive live day demo — scrubbable progress ring.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Vibration, Animated } from 'react-native';
import { Text } from '../../../shared/ui';
import {
  useTheme,
  Spacing,
  Typography,
  Radius,
  Weight,
  getFontFamilyForWeight,
} from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import {
  DAY_LEFT,
  DAY_PASSED,
  useEnter,
  useLiveDayClock,
} from './onboardingMotion';
import { LiveDayRing } from './LiveDayRing';
import { useReduceMotion } from '../../../shared/ui/useReduceMotion';

interface InteractiveDayDemoProps {
  active: boolean;
}

export function InteractiveDayDemo({ active }: InteractiveDayDemoProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const clock = useLiveDayClock(active);
  const [highlightWidgets, setHighlightWidgets] = useState(false);
  const title = useEnter(active, 40);
  const sub = useEnter(active, 120);
  const ringEnter = useEnter(active, 180);
  const metrics = useEnter(active, 280);
  const hint = useEnter(active, 360);
  const hintPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!highlightWidgets || reduceMotion) {
      hintPulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(hintPulse, {
          toValue: 1.03,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(hintPulse, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [highlightWidgets, hintPulse, reduceMotion]);

  return (
    <View style={styles.body}>
      <Animated.View style={title}>
        <Text variant="micro" style={[styles.eyebrow, { color: theme.percent }]}>
          {t('onboarding.dayDemo.eyebrow')}
        </Text>
        <Text
          variant="display"
          style={[
            styles.slideTitle,
            {
              color: theme.textPrimary,
              fontFamily: getFontFamilyForWeight(Weight.bold),
            },
          ]}
        >
          {t('onboarding.dayDemo.title')}
        </Text>
      </Animated.View>

      <Animated.View style={sub}>
        <Text
          variant="body"
          style={[styles.slideSubtitle, { color: theme.textSecondary }]}
        >
          {t('onboarding.dayDemo.subtitle')}
        </Text>
      </Animated.View>

      <Animated.View style={[styles.ringWrap, ringEnter]}>
        <LiveDayRing progress={clock.progress} interactive={active} />
      </Animated.View>

      <Animated.View style={[styles.metricsRow, metrics]}>
        <View style={styles.metric}>
          <View style={[styles.metricDot, { backgroundColor: DAY_PASSED }]} />
          <Text variant="caption" style={{ color: theme.textSecondary }}>
            {t('onboarding.dayDemo.passed')}
          </Text>
          <Text variant="sectionTitle" style={{ color: theme.textPrimary }}>
            {clock.percentDone}%
          </Text>
        </View>
        <View style={styles.metric}>
          <View style={[styles.metricDot, { backgroundColor: DAY_LEFT }]} />
          <Text variant="caption" style={{ color: theme.textSecondary }}>
            {t('onboarding.dayDemo.left')}
          </Text>
          <Text variant="sectionTitle" style={{ color: theme.textPrimary }}>
            {clock.remainingLabel}
          </Text>
        </View>
      </Animated.View>

      <Animated.View style={[{ transform: [{ scale: hintPulse }] }, hint]}>
        <Pressable
          onPress={() => {
            Vibration.vibrate(8);
            setHighlightWidgets(v => !v);
          }}
          style={[
            styles.widgetHint,
            {
              borderColor: highlightWidgets ? theme.percent : theme.glassBorder,
              backgroundColor: highlightWidgets
                ? 'rgba(232, 124, 32, 0.14)'
                : theme.glassBg,
            },
          ]}
        >
          <Text
            variant="caption"
            style={{
              color: highlightWidgets ? theme.percent : theme.textSecondary,
              textAlign: 'center',
            }}
          >
            {highlightWidgets
              ? t('onboarding.dayDemo.hintOn')
              : t('onboarding.dayDemo.hintOff')}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flexGrow: 1,
    paddingTop: Spacing.sm,
  },
  eyebrow: {
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  slideTitle: {
    marginBottom: Spacing.sm,
    lineHeight: Typography.display * 1.2,
  },
  slideSubtitle: {
    lineHeight: Typography.body * 1.5,
    marginBottom: Spacing.md,
  },
  ringWrap: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  metric: {
    alignItems: 'center',
    gap: 4,
  },
  metricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  widgetHint: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
});
