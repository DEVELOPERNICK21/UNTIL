import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme';
import { useReduceMotion } from './useReduceMotion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  /** 0 to 1. Changes animate; the first paint fills in from empty. */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
}

/**
 * Circular progress with a filling arc. The arc runs on the JS driver because
 * SVG props cannot use the native one; the short "done" pulse runs natively.
 */
export function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 6,
  color,
  children,
}: ProgressRingProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const clamped = Math.min(1, Math.max(0, progress));
  const fill = useRef(new Animated.Value(reduceMotion ? clamped : 0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const lastProgress = useRef(clamped);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (reduceMotion) {
      fill.setValue(clamped);
      lastProgress.current = clamped;
      return;
    }
    const grow = Animated.timing(fill, {
      toValue: clamped,
      duration: 750,
      delay: 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    grow.start();

    let bounce: Animated.CompositeAnimation | null = null;
    if (clamped >= 1 && lastProgress.current < 1) {
      bounce = Animated.sequence([
        Animated.delay(800),
        Animated.spring(pulse, {
          toValue: 1.12,
          friction: 4,
          tension: 220,
          useNativeDriver: true,
        }),
        Animated.spring(pulse, {
          toValue: 1,
          friction: 5,
          tension: 160,
          useNativeDriver: true,
        }),
      ]);
      bounce.start();
    }
    lastProgress.current = clamped;
    return () => {
      grow.stop();
      bounce?.stop();
    };
  }, [clamped, reduceMotion, fill, pulse]);

  const dashOffset = fill.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });
  const arcColor = clamped >= 1 ? theme.success : color ?? theme.percent;
  const box = { width: size, height: size, transform: [{ scale: pulse }] };

  return (
    <Animated.View style={box}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.progressTrack}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={arcColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={dashOffset}
          fill="none"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View pointerEvents="none" style={styles.center}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
