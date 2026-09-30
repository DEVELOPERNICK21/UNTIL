import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';
import type { BadgeGlyphKind, BadgeTier } from '../domain/badges/badgeCatalog';
import { useTheme } from '../theme';
import { useReduceMotion } from './useReduceMotion';

type Palette = { hi: string; mid: string; lo: string; ink: string };

const TIER_PALETTE: Record<BadgeTier, Palette> = {
  bronze: { hi: '#EDB07A', mid: '#C8824A', lo: '#8A5429', ink: '#3B2210' },
  silver: { hi: '#F4F6FA', mid: '#C5CBD4', lo: '#7D8590', ink: '#2B3038' },
  gold: { hi: '#FFE699', mid: '#F5B72E', lo: '#B7791F', ink: '#4A3008' },
  ember: { hi: '#FDBA74', mid: '#E87C20', lo: '#B93A0B', ink: '#FFF6EA' },
};

export const TIER_CONFETTI: Record<BadgeTier, string[]> = {
  bronze: ['#EDB07A', '#C8824A', '#FFFFFF', '#F5B72E'],
  silver: ['#F4F6FA', '#C5CBD4', '#FFFFFF', '#9DB4D6'],
  gold: ['#FFE699', '#F5B72E', '#FFFFFF', '#E87C20'],
  ember: ['#FDBA74', '#E87C20', '#FB7185', '#FFFFFF'],
};

export type MedalEnter = 'none' | 'pop';
export type MedalShine = 'none' | 'once' | 'loop';

export interface BadgeMedalProps {
  glyph: BadgeGlyphKind;
  tier: BadgeTier;
  size?: number;
  /** Greyed out, with an optional progress ring. */
  locked?: boolean;
  /** 0 to 1. Drawn as a ring around a locked medal. */
  progress?: number;
  enter?: MedalEnter;
  /** Delay before the entrance, for staggering a row of medals. */
  enterDelay?: number;
  shine?: MedalShine;
}

const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

/** Glyph art in a 40 x 40 box. `ink` is the fill or stroke colour. */
function renderGlyph(kind: BadgeGlyphKind, ink: string) {
  const stroke = {
    stroke: ink,
    strokeWidth: 3.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  switch (kind) {
    case 'spark':
      return (
        <Path
          d="M20 4 L24 16 L36 20 L24 24 L20 36 L16 24 L4 20 L16 16 Z"
          fill={ink}
        />
      );
    case 'flame':
      return (
        <Path
          d="M20 3.5 C22.5 10 30 14 30 23.5 A10 10 0 0 1 10 23.5 C10 18.5 13.2 15.6 14.8 12 C15.9 14.6 17 15.8 18.3 16.4 C17.7 11.6 18.3 7.6 20 3.5 Z"
          fill={ink}
        />
      );
    case 'check':
      return <Path d="M8.5 21 L17 29.5 L31.5 11.5" {...stroke} strokeWidth={4.4} />;
    case 'sun':
      return (
        <G>
          <Circle cx={20} cy={20} r={6.4} fill={ink} />
          {RAY_ANGLES.map(a => {
            const r = (a * Math.PI) / 180;
            return (
              <Line
                key={a}
                x1={20 + Math.cos(r) * 11.5}
                y1={20 + Math.sin(r) * 11.5}
                x2={20 + Math.cos(r) * 16}
                y2={20 + Math.sin(r) * 16}
                {...stroke}
                strokeWidth={3}
              />
            );
          })}
        </G>
      );
    case 'hourglass':
      return (
        <Path d="M11 6.5 H29 L20.6 20 L29 33.5 H11 L19.4 20 Z" fill={ink} />
      );
    case 'globe':
      return (
        <G>
          <Circle cx={20} cy={20} r={13.5} {...stroke} strokeWidth={2.8} />
          <Ellipse cx={20} cy={20} rx={5.6} ry={13.5} {...stroke} strokeWidth={2.4} />
          <Line x1={6.5} y1={20} x2={33.5} y2={20} {...stroke} strokeWidth={2.4} />
        </G>
      );
    case 'flag':
      return (
        <G>
          <Line x1={11.5} y1={6} x2={11.5} y2={34} {...stroke} />
          <Path d="M11.5 8 H31 L25.5 14.6 L31 21.2 H11.5 Z" fill={ink} />
        </G>
      );
    case 'target':
      return (
        <G>
          <Circle cx={20} cy={20} r={13.5} {...stroke} strokeWidth={2.8} />
          <Circle cx={20} cy={20} r={7} {...stroke} strokeWidth={2.8} />
          <Circle cx={20} cy={20} r={2.4} fill={ink} />
        </G>
      );
    case 'star':
      return (
        <Path
          d="M20 4.5 L24.6 14.6 L35.6 15.8 L27.4 23.2 L29.7 34 L20 28.5 L10.3 34 L12.6 23.2 L4.4 15.8 L15.4 14.6 Z"
          fill={ink}
        />
      );
  }
}

/**
 * Round medal with a tier-coloured rim, embossed glyph and optional entrance
 * pop and shine sweep. Locked medals are flat grey and can show a progress ring.
 */
export function BadgeMedal({
  glyph,
  tier,
  size = 64,
  locked = false,
  progress,
  enter = 'none',
  enterDelay = 0,
  shine = 'none',
}: BadgeMedalProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const motion = !reduceMotion;

  const popOn = motion && enter === 'pop';
  const scale = useRef(new Animated.Value(popOn ? 0.5 : 1)).current;
  const fade = useRef(new Animated.Value(popOn ? 0 : 1)).current;
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!popOn) {
      scale.setValue(1);
      fade.setValue(1);
      return;
    }
    scale.setValue(0.5);
    fade.setValue(0);
    const run = Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 120,
        delay: enterDelay,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 180,
        delay: enterDelay,
        useNativeDriver: true,
      }),
    ]);
    run.start();
    return () => run.stop();
  }, [popOn, enterDelay, scale, fade]);

  const shineOn = motion && !locked && shine !== 'none';
  useEffect(() => {
    if (!shineOn) return;
    sweep.setValue(0);
    const pass = Animated.timing(sweep, {
      toValue: 1,
      duration: 900,
      delay: enterDelay + 350,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    });
    const run =
      shine === 'loop'
        ? Animated.loop(Animated.sequence([pass, Animated.delay(2200)]))
        : pass;
    run.start();
    return () => run.stop();
  }, [shineOn, shine, enterDelay, sweep]);

  const palette = TIER_PALETTE[tier];
  const gid = `medal-${tier}-${locked ? 'locked' : 'open'}`;
  const ringOn = locked && progress != null && progress > 0;
  const ring = Math.min(1, Math.max(0, progress ?? 0));
  const ringRadius = 46;
  const ringLength = 2 * Math.PI * ringRadius;

  const rim = locked
    ? { hi: theme.divider, mid: theme.divider, lo: theme.progressTrack }
    : palette;
  const face = locked
    ? { hi: theme.cardLighter, lo: theme.cardBase }
    : { hi: palette.hi, lo: palette.mid };
  const ink = locked ? theme.textMuted : palette.ink;
  // Glyph art is 40 x 40; centre it in the 100 x 100 viewBox.
  const glyphScale = ringOn ? 0.92 : 1.05;
  const glyphShift = 50 - 20 * glyphScale;

  const sweepX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-size * 0.7, size * 1.1],
  });

  const shell = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };
  const enterStyle = { opacity: fade, transform: [{ scale }] };
  const barStyle = {
    width: size * 0.26,
    height: size * 1.5,
    transform: [{ translateX: sweepX }, { rotate: '22deg' }],
  };

  return (
    <Animated.View style={[shell, enterStyle]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={`${gid}-rim`} x1="0.15" y1="0" x2="0.85" y2="1">
            <Stop offset="0" stopColor={rim.hi} />
            <Stop offset="0.5" stopColor={rim.mid} />
            <Stop offset="1" stopColor={rim.lo} />
          </LinearGradient>
          <LinearGradient id={`${gid}-face`} x1="0.2" y1="0" x2="0.8" y2="1">
            <Stop offset="0" stopColor={face.hi} />
            <Stop offset="1" stopColor={face.lo} />
          </LinearGradient>
        </Defs>
        {ringOn ? (
          <G rotation={-90} origin="50, 50">
            <Circle
              cx={50}
              cy={50}
              r={ringRadius}
              stroke={theme.divider}
              strokeWidth={3.5}
              fill="none"
            />
            <Circle
              cx={50}
              cy={50}
              r={ringRadius}
              stroke={theme.percent}
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeDasharray={`${ringLength}`}
              strokeDashoffset={ringLength * (1 - ring)}
              fill="none"
            />
          </G>
        ) : null}
        <Circle cx={50} cy={50} r={ringOn ? 40 : 46} fill={`url(#${gid}-rim)`} />
        <Circle cx={50} cy={50} r={ringOn ? 33.5 : 38.5} fill={`url(#${gid}-face)`} />
        <Circle
          cx={50}
          cy={50}
          r={ringOn ? 33.5 : 38.5}
          stroke="#FFFFFF"
          strokeOpacity={locked ? 0.06 : 0.35}
          strokeWidth={1}
          fill="none"
        />
        <G
          opacity={locked ? 0.55 : 1}
          transform={`translate(${glyphShift} ${glyphShift}) scale(${glyphScale})`}
        >
          {/* Emboss: light copy one unit down, then the ink on top. */}
          {locked ? null : (
            <G transform="translate(0 1.2)" opacity={0.45}>
              {renderGlyph(glyph, '#FFFFFF')}
            </G>
          )}
          {renderGlyph(glyph, ink)}
        </G>
        {locked ? null : (
          <Ellipse
            cx={38}
            cy={30}
            rx={17}
            ry={8}
            fill="#FFFFFF"
            fillOpacity={0.22}
            transform="rotate(-24 38 30)"
          />
        )}
      </Svg>
      {shineOn ? (
        <View pointerEvents="none" style={[styles.clip, shell]}>
          <Animated.View style={[styles.bar, barStyle]} />
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  bar: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});
