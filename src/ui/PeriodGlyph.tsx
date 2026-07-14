import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Pressable } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  G,
} from 'react-native-svg';

export type PeriodGlyphKind = 'day' | 'month' | 'year' | 'life';

interface PeriodGlyphProps {
  kind: PeriodGlyphKind;
  size?: number;
  accent?: string;
  /** 0–1 progress for the ring around the icon. */
  progress?: number;
  animated?: boolean;
  pressed?: boolean;
  onPress?: () => void;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Rich kind palettes — not flat single-swatch orbs. */
const KIND_COLORS: Record<
  PeriodGlyphKind,
  { hi: string; mid: string; deep: string; glow: string }
> = {
  day: {
    hi: '#6EE7B7',
    mid: '#10B981',
    deep: '#065F46',
    glow: '#34D399',
  },
  month: {
    hi: '#FDE68A',
    mid: '#F59E0B',
    deep: '#92400E',
    glow: '#FBBF24',
  },
  year: {
    hi: '#FDBA74',
    mid: '#F97316',
    deep: '#9A3412',
    glow: '#FB923C',
  },
  life: {
    hi: '#FDA4AF',
    mid: '#F43F5E',
    deep: '#9F1239',
    glow: '#FB7185',
  },
};

/**
 * Interactive period glyph — color depth + motion kept inside the orb.
 */
export function PeriodGlyph({
  kind,
  size = 40,
  accent,
  progress = 0,
  animated = true,
  pressed = false,
  onPress,
}: PeriodGlyphProps) {
  const palette = KIND_COLORS[kind];
  const ringColor = accent ?? palette.mid;
  const gid = useMemo(
    () => `pg-${kind}-${Math.round(size)}`,
    [kind, size],
  );

  // Tight ring: 3px gutter so glow never escapes the component box.
  const ringGap = 5;
  const outer = size + ringGap * 2;
  const ringR = size / 2 + 1.5;
  const circ = 2 * Math.PI * ringR;
  const clamped = Math.min(1, Math.max(0, progress));

  const glow = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const beat = useRef(new Animated.Value(1)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(clamped)).current;
  const spark = useRef(new Animated.Value(0)).current;
  const pageFlip = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(ringAnim, {
      toValue: clamped,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped, ringAnim]);

  useEffect(() => {
    Animated.spring(pressScale, {
      toValue: pressed ? 1.08 : 1,
      friction: 6,
      tension: 200,
      useNativeDriver: true,
    }).start();
    if (pressed) {
      spark.setValue(0);
      Animated.timing(spark, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [pressed, pressScale, spark]);

  useEffect(() => {
    if (!animated) {
      return;
    }

    const glowLoop = Animated.loop(
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
      ]),
    );

    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: kind === 'day' ? 10000 : 16000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const pageLoop =
      kind === 'month'
        ? Animated.loop(
            Animated.sequence([
              Animated.timing(pageFlip, {
                toValue: 1,
                duration: 800,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(pageFlip, {
                toValue: 0,
                duration: 800,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.delay(700),
            ]),
          )
        : null;

    const beatLoop =
      kind === 'life'
        ? Animated.loop(
            Animated.sequence([
              Animated.timing(beat, {
                toValue: 1.1,
                duration: 240,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(beat, {
                toValue: 1,
                duration: 180,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(beat, {
                toValue: 1.06,
                duration: 200,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(beat, {
                toValue: 1,
                duration: 360,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.delay(800),
            ]),
          )
        : Animated.loop(
            Animated.sequence([
              Animated.timing(beat, {
                toValue: 1.03,
                duration: 1700,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(beat, {
                toValue: 1,
                duration: 1700,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
            ]),
          );

    glowLoop.start();
    spinLoop.start();
    shimmerLoop.start();
    pageLoop?.start();
    beatLoop.start();

    return () => {
      glowLoop.stop();
      spinLoop.stop();
      shimmerLoop.stop();
      pageLoop?.stop();
      beatLoop.stop();
    };
  }, [animated, kind, glow, spin, shimmer, beat, pageFlip]);

  const dashOffset = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circ, 0],
  });
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const innerGlowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.55],
  });
  const sparkOpacity = spark.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0, 0.85, 0],
  });
  const sparkScale = spark.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.12],
  });
  const pageScale = pageFlip.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.9],
  });
  const shimmerX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-size * 0.35, size * 0.35],
  });

  const body = (
    <View style={[styles.wrap, { width: outer, height: outer }]}>
      {/* Progress ring — stays in the gutter, no orbiting satellites */}
      <Svg
        width={outer}
        height={outer}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Circle
          cx={outer / 2}
          cy={outer / 2}
          r={ringR}
          stroke={ringColor}
          strokeOpacity={0.22}
          strokeWidth={2}
          fill="none"
        />
        <AnimatedCircle
          cx={outer / 2}
          cy={outer / 2}
          r={ringR}
          stroke={ringColor}
          strokeWidth={2.25}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={dashOffset}
          rotation={-90}
          origin={`${outer / 2}, ${outer / 2}`}
        />
      </Svg>

      {/* Orb stage — EVERYTHING motion-clipped to the circle */}
      <Animated.View
        style={[
          styles.orbStage,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: pressScale }],
          },
        ]}
      >
        {/* Contained press flash */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius: size / 2,
              borderWidth: 2,
              borderColor: palette.hi,
              opacity: sparkOpacity,
              transform: [{ scale: sparkScale }],
            },
          ]}
        />

        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            { transform: [{ scale: beat }] },
          ]}
        >
          {/* Base rich orb */}
          <Svg width={size} height={size} viewBox="0 0 36 36">
            <Defs>
              <RadialGradient id={`${gid}-orb`} cx="32%" cy="28%" r="72%">
                <Stop offset="0" stopColor={palette.hi} stopOpacity="1" />
                <Stop offset="0.45" stopColor={palette.mid} stopOpacity="1" />
                <Stop offset="1" stopColor={palette.deep} stopOpacity="1" />
              </RadialGradient>
              <LinearGradient id={`${gid}-shine`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.45" />
                <Stop offset="0.4" stopColor="#FFFFFF" stopOpacity="0.08" />
                <Stop offset="1" stopColor="#000000" stopOpacity="0.25" />
              </LinearGradient>
            </Defs>
            <Circle cx={18} cy={18} r={16} fill={`url(#${gid}-orb)`} />
            <Circle cx={18} cy={18} r={16} fill={`url(#${gid}-shine)`} />
            <Circle
              cx={12.5}
              cy={11}
              r={5}
              fill="#FFFFFF"
              fillOpacity={0.28}
            />
          </Svg>

          {/* Moving highlight strip — clipped by orbStage */}
          {animated ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.shimmer,
                {
                  backgroundColor: palette.hi,
                  transform: [{ translateX: shimmerX }, { rotate: '24deg' }],
                  opacity: glow.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.12, 0.28],
                  }),
                },
              ]}
            />
          ) : null}

          {/* Soft inner pulse — clipped */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.innerPulse,
              {
                backgroundColor: palette.glow,
                opacity: animated ? innerGlowOpacity : 0.3,
              },
            ]}
          />

          {/* Day: rays spin inside orb only */}
          {kind === 'day' ? (
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                { transform: [{ rotate: animated ? rotate : '0deg' }] },
              ]}
            >
              <Svg width={size} height={size} viewBox="0 0 36 36">
                <G>
                  <Path
                    d="M18 9.2v2M18 24.8v2M9.2 18h2M24.8 18h2M11.5 11.5l1.4 1.4M23.1 23.1l1.4 1.4M11.5 24.5l1.4-1.4M23.1 12.9l1.4-1.4"
                    stroke="#FFFFFF"
                    strokeOpacity={0.95}
                    strokeWidth={1.7}
                    strokeLinecap="round"
                  />
                  <Circle cx={18} cy={18} r={4.8} fill="#FFFFFF" />
                  <Circle
                    cx={16.6}
                    cy={16.8}
                    r={1.2}
                    fill={palette.mid}
                    fillOpacity={0.4}
                  />
                </G>
              </Svg>
            </Animated.View>
          ) : null}

          {/* Year: planet + slow inner orbit (kept inside) */}
          {kind === 'year' ? (
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                { transform: [{ rotate: animated ? rotate : '0deg' }] },
              ]}
            >
              <Svg width={size} height={size} viewBox="0 0 36 36">
                <Circle
                  cx={18}
                  cy={18}
                  r={7.2}
                  stroke="#FFFFFF"
                  strokeOpacity={0.4}
                  strokeWidth={1.2}
                  fill="none"
                />
                <Circle cx={18} cy={18} r={2.6} fill="#FFFFFF" />
                <Circle cx={18} cy={11.2} r={1.5} fill="#FFFFFF" fillOpacity={0.95} />
              </Svg>
            </Animated.View>
          ) : null}

          {/* Month: calendar page curl — clipped */}
          {kind === 'month' ? (
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  transform: [
                    { scaleY: pageScale },
                    { translateY: pageFlip.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -1],
                    }) },
                  ],
                },
              ]}
            >
              <Svg width={size} height={size} viewBox="0 0 36 36">
                <Rect
                  x={10.5}
                  y={11}
                  width={15}
                  height={14}
                  rx={2.5}
                  fill="#FFFFFF"
                  fillOpacity={0.96}
                />
                <Path
                  d="M13.2 9.2v3.4M22.8 9.2v3.4M10.5 15h15"
                  stroke={palette.deep}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
                <Circle cx={14.2} cy={19.2} r={1.2} fill={palette.mid} />
                <Circle cx={18} cy={19.2} r={1.2} fill={palette.mid} />
                <Circle cx={21.8} cy={19.2} r={1.2} fill={palette.mid} />
                <Circle
                  cx={14.2}
                  cy={22.6}
                  r={1}
                  fill={palette.mid}
                  fillOpacity={0.45}
                />
                <Circle
                  cx={18}
                  cy={22.6}
                  r={1}
                  fill={palette.mid}
                  fillOpacity={0.45}
                />
              </Svg>
            </Animated.View>
          ) : null}

          {kind === 'life' ? (
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
              <Svg width={size} height={size} viewBox="0 0 36 36">
                <Path
                  d="M18 25.2s-6.6-4-6.6-8.4c0-2.4 1.85-4 3.95-4 1.35 0 2.3.75 2.65 1.5.35-.75 1.3-1.5 2.65-1.5 2.1 0 3.95 1.6 3.95 4 0 4.4-6.6 8.4-6.6 8.4z"
                  fill="#FFFFFF"
                  fillOpacity={0.96}
                />
              </Svg>
            </View>
          ) : null}
        </Animated.View>
      </Animated.View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        hitSlop={8}
        style={({ pressed: p }) => [{ opacity: p ? 0.92 : 1 }]}
      >
        {body}
      </Pressable>
    );
  }

  return body;
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbStage: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shimmer: {
    position: 'absolute',
    width: 10,
    top: -4,
    bottom: -4,
    opacity: 0.2,
  },
  innerPulse: {
    position: 'absolute',
    width: '55%',
    height: '55%',
    borderRadius: 999,
    alignSelf: 'center',
    top: '22%',
  },
});
