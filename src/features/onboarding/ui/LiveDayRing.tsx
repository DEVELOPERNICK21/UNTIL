/**
 * Scrubbable "how much of today has passed" ring used by the onboarding day demo.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Vibration, Animated, Easing, PanResponder } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '../../../shared/ui';
import { useTheme, Weight, getFontFamilyForWeight } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { DAY_LEFT, DAY_PASSED } from './onboardingMotion';
import { useReduceMotion } from '../../../shared/ui/useReduceMotion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function LiveDayRing({
  progress,
  size = 200,
  interactive,
}: {
  progress: number;
  size?: number;
  interactive: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const live = Math.min(1, Math.max(0, progress));

  const [scrubbing, setScrubbing] = useState(false);
  const [display, setDisplay] = useState(live);
  const ring = useRef(new Animated.Value(live)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const rotateHint = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (scrubbing) return;
    setDisplay(live);
    if (reduceMotion) {
      ring.setValue(live);
      return;
    }
    Animated.timing(ring, {
      toValue: live,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [live, scrubbing, ring, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(1);
      rotateHint.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.03,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    const spin = Animated.loop(
      Animated.timing(rotateHint, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => {
      loop.stop();
      spin.stop();
    };
  }, [pulse, rotateHint, reduceMotion]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => interactive,
        onMoveShouldSetPanResponder: () => interactive,
        onPanResponderGrant: () => {
          setScrubbing(true);
          Vibration.vibrate(6);
        },
        onPanResponderMove: (_, g) => {
          const delta = g.dx / (size * 0.9);
          const next = Math.min(1, Math.max(0, live + delta));
          setDisplay(next);
          ring.setValue(next);
        },
        onPanResponderRelease: () => {
          setScrubbing(false);
          Vibration.vibrate(8);
          Animated.spring(ring, {
            toValue: live,
            friction: 7,
            tension: 60,
            useNativeDriver: false,
          }).start();
          setDisplay(live);
        },
        onPanResponderTerminate: () => {
          setScrubbing(false);
          setDisplay(live);
          ring.setValue(live);
        },
      }),
    [interactive, live, ring, size]
  );

  const dashOffset = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });
  const percent = Math.round(display * 100);
  const orbitRotate = rotateHint.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      {...pan.panHandlers}
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale: pulse }],
      }}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={DAY_LEFT}
          strokeWidth={stroke}
          fill="none"
          strokeOpacity={0.9}
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={DAY_PASSED}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ rotate: orbitRotate }] },
        ]}
      >
        <View
          style={[
            styles.orbitTick,
            {
              backgroundColor: theme.percent,
              top: stroke / 2,
              left: size / 2 - 4,
            },
          ]}
        />
      </Animated.View>

      <Text
        variant="micro"
        style={{ color: theme.textSecondary, letterSpacing: 2 }}
      >
        {scrubbing ? t('onboarding.dayDemo.preview') : t('onboarding.dayDemo.today')}
      </Text>
      <Text
        variant="timer"
        style={[
          styles.livePercent,
          {
            color: theme.percent,
            fontFamily: getFontFamilyForWeight(Weight.semibold),
          },
        ]}
      >
        {percent}%
      </Text>
      <Text variant="caption" style={{ color: theme.textSecondary }}>
        {scrubbing
          ? t('onboarding.dayDemo.release')
          : t('onboarding.dayDemo.ofDayPassed')}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  livePercent: {
    marginVertical: 2,
  },
  orbitTick: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
