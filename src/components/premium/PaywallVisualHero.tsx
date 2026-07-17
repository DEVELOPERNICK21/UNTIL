/**
 * Paywall visual hero — Ember + life progress for ownership / loss aversion.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text, Ember } from '../../ui';
import {
  useTheme,
  Spacing,
  Radius,
  Weight,
  getFontFamilyForWeight,
} from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface PaywallVisualHeroProps {
  headline: string;
  subheadline: string;
  /** 0–1 life progress when known */
  lifeProgress?: number;
}

export function PaywallVisualHero({
  headline,
  subheadline,
  lifeProgress,
}: PaywallVisualHeroProps) {
  const theme = useTheme();
  const glow = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const hasLife =
    typeof lifeProgress === 'number' &&
    Number.isFinite(lifeProgress) &&
    lifeProgress > 0;

  const clamped = hasLife
    ? Math.min(1, Math.max(0, lifeProgress as number))
    : 0.35;
  const lifePercent = Math.round(clamped * 100);

  useEffect(() => {
    Animated.timing(ring, {
      toValue: clamped,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [clamped, glow, ring]);

  const size = 132;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={styles.wrap}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            backgroundColor: theme.percent,
            opacity: glow.interpolate({
              inputRange: [0, 1],
              outputRange: [0.08, 0.18],
            }),
            transform: [
              {
                scale: glow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.94, 1.08],
                }),
              },
            ],
          },
        ]}
      />

      <View style={styles.ringWrap}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.progressTrack}
            strokeWidth={stroke}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.percent}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.emberCenter}>
          <Ember progress={clamped} size={56} />
        </View>
      </View>

      {hasLife ? (
        <View
          style={[
            styles.lifeChip,
            {
              backgroundColor: 'rgba(232, 124, 32, 0.14)',
              borderColor: theme.percent,
            },
          ]}
        >
          <Text
            variant="caption"
            style={{
              color: theme.percent,
              fontFamily: getFontFamilyForWeight(Weight.semibold),
            }}
          >
            {lifePercent}% of your expected life lived
          </Text>
        </View>
      ) : null}

      <Text
        variant="display"
        style={[
          styles.headline,
          {
            color: theme.textPrimary,
            fontFamily: getFontFamilyForWeight(Weight.bold),
          },
        ]}
      >
        {headline}
      </Text>
      <Text
        variant="body"
        style={[styles.sub, { color: theme.textSecondary }]}
      >
        {subheadline}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: 0,
  },
  ringWrap: {
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
  },
  emberCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lifeChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    marginBottom: Spacing[3],
  },
  headline: {
    textAlign: 'center',
    marginBottom: Spacing[2],
    lineHeight: 34,
  },
  sub: {
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 340,
  },
});
