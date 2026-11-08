/**
 * One tappable home-screen widget preview in the onboarding widgets beat.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { Text } from '../../../shared/ui';
import {
  useTheme,
  Spacing,
  Radius,
  Weight,
  getFontFamilyForWeight,
  Shadows,
} from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { DAY_LEFT, DAY_PASSED, useEnter } from './onboardingMotion';
import { useReduceMotion } from '../../../shared/ui/useReduceMotion';

export function WidgetMock({
  title,
  value,
  accent,
  progress,
  selected,
  onPress,
  enterDelay,
  active,
}: {
  title: string;
  value: string;
  accent: string;
  progress: number;
  selected: boolean;
  onPress: () => void;
  enterDelay: number;
  active: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const enter = useEnter(active, enterDelay);
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active || reduceMotion) {
      bob.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 1600 + enterDelay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1600 + enterDelay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, bob, enterDelay, reduceMotion]);

  return (
    <Animated.View
      style={[
        enter,
        {
          flex: 1,
          transform: [
            ...(enter.transform ?? []),
            {
              translateY: bob.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -4],
              }),
            },
            { scale: selected ? 1.04 : 1 },
          ],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        style={[
          styles.widgetCard,
          {
            backgroundColor: theme.glassBg,
            borderColor: selected ? accent : theme.glassBorder,
            ...Shadows.glass,
          },
        ]}
      >
        <Text
          variant="micro"
          style={{ color: theme.textSecondary, letterSpacing: 1 }}
        >
          {title}
        </Text>
        <Text
          variant="title"
          style={{
            color: accent,
            marginTop: 4,
            fontFamily: getFontFamilyForWeight(Weight.semibold),
          }}
        >
          {value}
        </Text>
        <View style={[styles.widgetBarTrack, { backgroundColor: DAY_PASSED }]}>
          <View
            style={[
              styles.widgetBarFill,
              {
                width: `${Math.round(progress * 100)}%` as `${number}%`,
                backgroundColor: DAY_LEFT,
              },
            ]}
          />
        </View>
        {selected ? (
          <Text
            variant="micro"
            style={{ color: accent, marginTop: 8, textAlign: 'center' }}
          >
            {t('onboarding.widgets.addFromHome')}
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  widgetCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 120,
  },
  widgetBarTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  widgetBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
