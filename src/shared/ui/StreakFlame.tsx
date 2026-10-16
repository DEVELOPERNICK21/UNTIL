import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTheme } from '../theme';
import { useReduceMotion } from './useReduceMotion';

interface StreakFlameProps {
  size?: number;
  /** Lit when today is counted, dim when it is not. */
  lit?: boolean;
  /** Change to play the one-time pop and glow ring. */
  burstKey?: string | number | null;
}

/**
 * Small flame for the streak chip. Flickers while lit, and pops with a ring
 * when a new day is counted.
 */
export function StreakFlame({
  size = 26,
  lit = true,
  burstKey = null,
}: StreakFlameProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const flicker = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion || !lit) {
      flicker.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, {
          toValue: 1,
          duration: 520,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(flicker, {
          toValue: 0,
          duration: 640,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [lit, reduceMotion, flicker]);

  useEffect(() => {
    if (burstKey == null || reduceMotion) return;
    pop.setValue(1);
    ring.setValue(0);
    const run = Animated.parallel([
      Animated.sequence([
        Animated.spring(pop, {
          toValue: 1.45,
          friction: 4,
          tension: 240,
          useNativeDriver: true,
        }),
        Animated.spring(pop, {
          toValue: 1,
          friction: 5,
          tension: 140,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(ring, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    run.start();
    return () => run.stop();
  }, [burstKey, reduceMotion, pop, ring]);

  const scaleY = flicker.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const scaleX = flicker.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.94],
  });
  const tilt = flicker.interpolate({
    inputRange: [0, 1],
    outputRange: ['-2deg', '2deg'],
  });
  const ringScale = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 2.1],
  });
  const ringOpacity = ring.interpolate({
    inputRange: [0, 0.15, 1],
    outputRange: [0, 0.7, 0],
  });

  const box = { width: size, height: size };
  const ringStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderColor: theme.percent,
    opacity: ringOpacity,
    transform: [{ scale: ringScale }],
  };
  const flameStyle = {
    transform: [
      { scale: pop },
      { rotate: tilt },
      { scaleX },
      { scaleY },
    ],
  };

  return (
    <View style={[styles.wrap, box]}>
      <Animated.View pointerEvents="none" style={[styles.ring, ringStyle]} />
      <Animated.View style={flameStyle}>
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Defs>
            <LinearGradient id="flame-lit" x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0" stopColor="#FDE68A" />
              <Stop offset="0.45" stopColor="#F59E0B" />
              <Stop offset="1" stopColor="#E0480F" />
            </LinearGradient>
          </Defs>
          <Path
            d="M20 3.5 C22.5 10 30 14 30 23.5 A10 10 0 0 1 10 23.5 C10 18.5 13.2 15.6 14.8 12 C15.9 14.6 17 15.8 18.3 16.4 C17.7 11.6 18.3 7.6 20 3.5 Z"
            fill={lit ? 'url(#flame-lit)' : theme.textMuted}
            fillOpacity={lit ? 1 : 0.5}
          />
          {lit ? (
            <Path
              d="M20 19 C21.5 22 25 23.5 25 27.5 A5 5 0 0 1 15 27.5 C15 25 17 24 18 21.5 C18.5 22.4 19.2 22.8 19.6 22.8 C19.4 21.4 19.5 20.2 20 19 Z"
              fill="#FFF3C4"
              fillOpacity={0.9}
            />
          ) : null}
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
  },
});
