import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useReduceMotion } from './useReduceMotion';

interface ConfettiBurstProps {
  /** Change this value to fire a new burst. `null` or `undefined` stays quiet. */
  burstKey: string | number | null | undefined;
  colors: readonly string[];
  /** How far pieces travel, in px. */
  radius?: number;
  count?: number;
  durationMs?: number;
}

interface Piece {
  dx: number;
  dy: number;
  fall: number;
  spin: number;
  w: number;
  h: number;
  round: boolean;
  color: string;
  delay: number;
}

/** Same input, same number. Keeps pieces stable across re-renders. */
function seeded(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function buildPieces(
  count: number,
  radius: number,
  colors: readonly string[],
): Piece[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (seeded(i + 1) - 0.5) * 0.6;
    const reach = radius * (0.55 + seeded(i + 40) * 0.5);
    const big = seeded(i + 90) > 0.6;
    return {
      dx: Math.cos(angle) * reach,
      // Bias upward so the burst fans out before gravity takes over.
      dy: Math.sin(angle) * reach - radius * 0.25,
      fall: radius * (0.45 + seeded(i + 7) * 0.4),
      spin: (seeded(i + 3) > 0.5 ? 1 : -1) * (360 + seeded(i + 11) * 540),
      w: big ? 9 : 6,
      h: big ? 5 : 6,
      round: seeded(i + 21) > 0.65,
      color: colors[i % colors.length],
      delay: seeded(i + 55) * 90,
    };
  });
}

/**
 * One-shot confetti fan. Sits at its parent's centre, ignores touches and does
 * nothing when the system asks for reduced motion.
 */
export function ConfettiBurst({
  burstKey,
  colors,
  radius = 120,
  count = 26,
  durationMs = 1500,
}: ConfettiBurstProps) {
  const reduceMotion = useReduceMotion();
  const t = useRef(new Animated.Value(0)).current;
  const pieces = useMemo(
    () => buildPieces(count, radius, colors),
    [count, radius, colors],
  );

  const active = burstKey != null && !reduceMotion;
  useEffect(() => {
    if (!active) return;
    t.setValue(0);
    const run = Animated.timing(t, {
      toValue: 1,
      duration: durationMs,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [active, burstKey, durationMs, t]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={styles.origin}>
      {pieces.map((p, i) => {
        // Start after a small per-piece delay by remapping the shared clock.
        const lead = p.delay / durationMs;
        const local = t.interpolate({
          inputRange: [0, lead, 1],
          outputRange: [0, 0, 1],
        });
        const translateX = local.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [0, p.dx * 0.9, p.dx],
        });
        const translateY = local.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [0, p.dy * 0.9, p.dy + p.fall],
        });
        const rotate = local.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.spin}deg`],
        });
        const opacity = local.interpolate({
          inputRange: [0, 0.06, 0.7, 1],
          outputRange: [0, 1, 1, 0],
        });
        const scale = local.interpolate({
          inputRange: [0, 0.12, 1],
          outputRange: [0.3, 1.1, 0.85],
        });
        const style = {
          width: p.w,
          height: p.h,
          borderRadius: p.round ? p.w : 1.5,
          backgroundColor: p.color,
          opacity,
          transform: [{ translateX }, { translateY }, { rotate }, { scale }],
        };
        return <Animated.View key={i} style={[styles.piece, style]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  origin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
  },
  piece: {
    position: 'absolute',
  },
});
