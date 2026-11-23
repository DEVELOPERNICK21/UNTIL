import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useReduceMotion } from '../../../shared/ui/useReduceMotion';
import { CALM } from './calmPalette';
import { wavePath } from './wavePath';

/** A few fixed points of light, as fractions of the screen. Static: stars do not need to move. */
const STARS = [
  [0.12, 0.1, 1.4], [0.33, 0.06, 1], [0.58, 0.13, 1.2], [0.86, 0.08, 1.5], [0.72, 0.22, 1],
  [0.08, 0.31, 1.1], [0.93, 0.36, 1.3], [0.45, 0.28, 0.9], [0.22, 0.47, 1], [0.8, 0.52, 0.9],
] as const;

interface Props {
  children: React.ReactNode;
  /** Draw the slow wave at the bottom, like breath. Used while breathing. */
  wave?: boolean;
}

/** The night sky behind every Pause screen. */
export function CalmBackdrop({ children, wave = false }: Props) {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!wave || reduceMotion) {
      drift.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.timing(drift, { toValue: -width, duration: 16000, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [wave, reduceMotion, width, drift]);

  const waveHeight = 120;
  return (
    <View style={styles.root}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={CALM.bgTop} />
            <Stop offset="0.55" stopColor={CALM.bgMid} />
            <Stop offset="1" stopColor={CALM.bgBottom} />
          </LinearGradient>
          <RadialGradient id="moon" cx="78%" cy="9%" rx="62%" ry="40%">
            <Stop offset="0" stopColor={CALM.glow} stopOpacity="0.34" />
            <Stop offset="1" stopColor={CALM.glow} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="low" cx="30%" cy="105%" rx="80%" ry="36%">
            <Stop offset="0" stopColor={CALM.accent} stopOpacity="0.16" />
            <Stop offset="1" stopColor={CALM.accent} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#sky)" />
        <Rect width={width} height={height} fill="url(#moon)" />
        <Rect width={width} height={height} fill="url(#low)" />
        {STARS.map(([x, y, r]) => (
          <Circle key={`${x}-${y}`} cx={x * width} cy={y * height} r={r} fill={CALM.text} opacity={0.28} />
        ))}
      </Svg>

      {wave ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.wave, { width: width * 2, height: waveHeight, transform: [{ translateX: drift }] }]}
        >
          <Svg width={width * 2} height={waveHeight}>
            <Path d={wavePath(width * 2, 46, 11, 4)} stroke={CALM.accent} strokeWidth={1.4} opacity={0.5} fill="none" />
            <Path d={wavePath(width * 2, 66, 8, 6)} stroke={CALM.accent} strokeWidth={1} opacity={0.28} fill="none" />
          </Svg>
        </Animated.View>
      ) : null}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CALM.bgTop,
  },
  wave: {
    position: 'absolute',
    bottom: 40,
    left: 0,
  },
});
