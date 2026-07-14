import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
  AccessibilityInfo,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Line,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { progressBand, type ProgressBand } from '../theme/emotionalCopy';
import { useReduceMotion } from '../hooks';

export type EmberMood = ProgressBand;

type EmberProps = {
  /** Day progress 0–1 drives mood. */
  progress?: number;
  mood?: EmberMood;
  size?: number;
  animated?: boolean;
  /** Tap for a calm happy response (default true). */
  interactive?: boolean;
  /** Called when the user taps Ember (after happy reaction starts). */
  onInteract?: () => void;
};

const MOOD_COLOR: Record<
  EmberMood,
  { hi: string; mid: string; deep: string; glow: string }
> = {
  dawn: {
    hi: '#FDE68A',
    mid: '#F59E0B',
    deep: '#B45309',
    glow: 'rgba(253, 230, 138, 0.45)',
  },
  open: {
    hi: '#FDA4AF',
    mid: '#FB7185',
    deep: '#E11D48',
    glow: 'rgba(251, 113, 133, 0.4)',
  },
  mid: {
    hi: '#FDBA74',
    mid: '#E87C20',
    deep: '#C2410C',
    glow: 'rgba(232, 124, 32, 0.42)',
  },
  late: {
    hi: '#C4B5FD',
    mid: '#8B5CF6',
    deep: '#5B21B6',
    glow: 'rgba(139, 92, 246, 0.4)',
  },
  dusk: {
    hi: '#A5B4FC',
    mid: '#6366F1',
    deep: '#312E81',
    glow: 'rgba(99, 102, 241, 0.4)',
  },
};

const PARTICLE_COUNT = 6;

type ParticleSpec = {
  startX: number;
  drift: number;
  size: number;
  delay: number;
  duration: number;
};

/**
 * Ember — floating little time spirit.
 * Soft glow, tiny orbiting clock hands, sparkle trail, calm tap response.
 */
export function Ember({
  progress = 0.35,
  mood: moodProp,
  size = 56,
  animated = true,
  interactive = true,
  onInteract,
}: EmberProps) {
  const reduceMotion = useReduceMotion();
  const mood = moodProp ?? progressBand(progress);
  const colors = MOOD_COLOR[mood];
  const gid = `ember-${mood}-${Math.round(size)}`;
  const shouldAnimate = animated && !reduceMotion;
  const stage = Math.round(size * 1.55);

  const floatY = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(1)).current;
  const blink = useRef(new Animated.Value(1)).current;
  const eyeGlow = useRef(new Animated.Value(0.55)).current;
  const orbit = useRef(new Animated.Value(0)).current;
  const tapBounce = useRef(new Animated.Value(1)).current;

  const particleAnims = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => new Animated.Value(0)),
  ).current;

  const particles: ParticleSpec[] = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        startX: (i / (PARTICLE_COUNT - 1) - 0.5) * size * 0.7,
        drift: ((i % 3) - 1) * size * 0.18,
        size: 2 + (i % 3),
        delay: i * 420,
        duration: 2200 + (i % 4) * 280,
      })),
    [size],
  );

  const [happy, setHappy] = useState(false);

  useEffect(() => {
    if (!shouldAnimate) {
      floatY.setValue(0);
      breathe.setValue(1);
      blink.setValue(1);
      eyeGlow.setValue(0.7);
      orbit.setValue(0);
      particleAnims.forEach(p => p.setValue(0));
      return;
    }

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -size * 0.08,
          duration: mood === 'dusk' ? 2600 : 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: size * 0.04,
          duration: mood === 'dusk' ? 2600 : 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1.05,
          duration: mood === 'dusk' ? 2100 : 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 1,
          duration: mood === 'dusk' ? 2100 : 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const blinkLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(2600 + (mood === 'dusk' ? 800 : 0)),
        Animated.timing(blink, {
          toValue: 0.12,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(blink, {
          toValue: 1,
          duration: 130,
          useNativeDriver: true,
        }),
        Animated.delay(400),
        Animated.timing(blink, {
          toValue: 0.2,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.timing(blink, {
          toValue: 1,
          duration: 110,
          useNativeDriver: true,
        }),
        Animated.delay(900),
      ]),
    );

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(eyeGlow, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(eyeGlow, {
          toValue: 0.45,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const orbitLoop = Animated.loop(
      Animated.timing(orbit, {
        toValue: 1,
        duration: 14000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const sparkLoops = particleAnims.map((anim, i) => {
      const spec = particles[i];
      anim.setValue(0);
      return Animated.loop(
        Animated.sequence([
          Animated.delay(spec.delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: spec.duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );
    });

    floatLoop.start();
    breatheLoop.start();
    blinkLoop.start();
    glowLoop.start();
    orbitLoop.start();
    sparkLoops.forEach(l => l.start());

    return () => {
      floatLoop.stop();
      breatheLoop.stop();
      blinkLoop.stop();
      glowLoop.stop();
      orbitLoop.stop();
      sparkLoops.forEach(l => l.stop());
    };
  }, [
    shouldAnimate,
    mood,
    size,
    floatY,
    breathe,
    blink,
    eyeGlow,
    orbit,
    particleAnims,
    particles,
  ]);

  const playHappy = useCallback(() => {
    if (!interactive) return;
    setHappy(true);
    onInteract?.();
    void AccessibilityInfo.announceForAccessibility('Ember smiles');

    Animated.parallel([
      Animated.sequence([
        Animated.timing(tapBounce, {
          toValue: 1.14,
          duration: 160,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
        Animated.timing(tapBounce, {
          toValue: 1,
          duration: 280,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
      ...particleAnims.map((anim, i) =>
        Animated.sequence([
          Animated.delay(i * 40),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 900,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start(({ finished }) => {
      if (finished) setHappy(false);
    });
  }, [interactive, tapBounce, particleAnims, onInteract]);

  const orbitSpin = orbit.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const orbitSpinReverse = orbit.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  const eyeOpen = shouldAnimate ? blink : 1;
  const handLen = size * 0.16;

  // Combine scale anims without Animated.multiply typing issues
  const scaleStyle = {
    transform: [
      { translateY: shouldAnimate ? floatY : 0 },
      { scale: breathe },
      { scale: tapBounce },
    ],
  };

  return (
    <Pressable
      onPress={playHappy}
      disabled={!interactive}
      accessibilityRole={interactive ? 'button' : undefined}
      accessibilityLabel={`Ember companion, ${mood} mood${
        interactive ? '. Tap to say hello' : ''
      }`}
      hitSlop={8}
    >
      <Animated.View
        style={[
          styles.stage,
          {
            width: stage,
            height: stage,
          },
          scaleStyle,
        ]}
      >
        <View
          pointerEvents="none"
          style={[
            styles.aura,
            {
              width: size * 1.15,
              height: size * 1.15,
              borderRadius: size,
              backgroundColor: colors.glow,
            },
          ]}
        />

        {particles.map((spec, i) => {
          const t = particleAnims[i];
          const translateY = t.interpolate({
            inputRange: [0, 1],
            outputRange: [size * 0.15, -size * 0.55],
          });
          const translateX = t.interpolate({
            inputRange: [0, 1],
            outputRange: [spec.startX, spec.startX + spec.drift],
          });
          const opacity = t.interpolate({
            inputRange: [0, 0.15, 0.7, 1],
            outputRange: [0, 0.9, 0.45, 0],
          });
          const scale = t.interpolate({
            inputRange: [0, 0.3, 1],
            outputRange: [0.4, 1, 0.2],
          });
          return (
            <Animated.View
              key={`spark-${i}`}
              pointerEvents="none"
              style={[
                styles.spark,
                {
                  width: spec.size,
                  height: spec.size,
                  borderRadius: spec.size,
                  backgroundColor: i % 2 === 0 ? colors.hi : '#FFFFFF',
                  opacity,
                  transform: [{ translateX }, { translateY }, { scale }],
                },
              ]}
            />
          );
        })}

        <Animated.View
          pointerEvents="none"
          style={[
            styles.orbitLayer,
            {
              width: size * 0.95,
              height: size * 0.95,
              transform: [{ rotate: shouldAnimate ? orbitSpin : '28deg' }],
            },
          ]}
        >
          <View
            style={[
              styles.handWrap,
              { top: 2, left: '50%', marginLeft: -1 },
            ]}
          >
            <View
              style={[
                styles.minuteHand,
                {
                  height: handLen,
                  backgroundColor: colors.hi,
                  shadowColor: colors.mid,
                },
              ]}
            />
          </View>
          <View
            style={[
              styles.handWrap,
              {
                bottom: 4,
                left: '50%',
                marginLeft: -1,
                transform: [{ rotate: '180deg' }],
              },
            ]}
          >
            <View
              style={[
                styles.hourHand,
                {
                  height: handLen * 0.72,
                  backgroundColor: colors.mid,
                },
              ]}
            />
          </View>
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.orbitLayer,
            {
              width: size * 0.72,
              height: size * 0.72,
              transform: [
                { rotate: shouldAnimate ? orbitSpinReverse : '-18deg' },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.tick,
              { top: 0, backgroundColor: colors.hi, opacity: 0.7 },
            ]}
          />
          <View
            style={[
              styles.tick,
              { bottom: 0, backgroundColor: colors.hi, opacity: 0.55 },
            ]}
          />
          <View
            style={[
              styles.tickWide,
              { left: 0, backgroundColor: '#FFFFFF', opacity: 0.5 },
            ]}
          />
          <View
            style={[
              styles.tickWide,
              { right: 0, backgroundColor: '#FFFFFF', opacity: 0.5 },
            ]}
          />
        </Animated.View>

        <View style={{ width: size, height: size }}>
          <Svg width={size} height={size} viewBox="0 0 64 64">
            <Defs>
              <RadialGradient id={gid} cx="35%" cy="28%" r="72%">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
                <Stop offset="0.32" stopColor={colors.hi} stopOpacity="1" />
                <Stop offset="0.72" stopColor={colors.mid} stopOpacity="1" />
                <Stop offset="1" stopColor={colors.deep} stopOpacity="1" />
              </RadialGradient>
            </Defs>
            <Circle cx={32} cy={34} r={24} fill={colors.glow} opacity={0.55} />
            <Circle cx={32} cy={34} r={21} fill={`url(#${gid})`} />
            <Ellipse
              cx={24}
              cy={24}
              rx={8}
              ry={5}
              fill="#FFFFFF"
              fillOpacity={0.38}
            />
            <Circle
              cx={32}
              cy={34}
              r={14}
              stroke="#FFFFFF"
              strokeOpacity={0.12}
              strokeWidth={1}
              fill="none"
            />
            <Line
              x1={32}
              y1={34}
              x2={32}
              y2={26}
              stroke="#FFFFFF"
              strokeOpacity={0.28}
              strokeWidth={1.2}
              strokeLinecap="round"
            />
            <Line
              x1={32}
              y1={34}
              x2={38}
              y2={36}
              stroke="#FFFFFF"
              strokeOpacity={0.22}
              strokeWidth={1.1}
              strokeLinecap="round"
            />
            <Path
              d={happy ? 'M22 41c4 7 16 7 20 0' : 'M24 40c3 4 13 4 16 0'}
              stroke="#FFFFFF"
              strokeOpacity={0.9}
              strokeWidth={2.2}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>

          <Animated.View
            style={[
              styles.eyeRow,
              {
                opacity: eyeOpen,
                transform: [{ scaleY: eyeOpen }],
              },
            ]}
            pointerEvents="none"
          >
            {[0, 1].map(side => (
              <View key={side} style={styles.eyeCluster}>
                <Animated.View
                  style={[
                    styles.eyeGlow,
                    {
                      backgroundColor: colors.hi,
                      opacity: shouldAnimate ? eyeGlow : 0.7,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.eye,
                    {
                      backgroundColor: '#FFF8E7',
                      shadowColor: colors.hi,
                    },
                  ]}
                />
                <View style={styles.eyeDot} />
              </View>
            ))}
          </Animated.View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  aura: {
    position: 'absolute',
  },
  spark: {
    position: 'absolute',
  },
  orbitLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  handWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  minuteHand: {
    width: 2,
    borderRadius: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  hourHand: {
    width: 2.5,
    borderRadius: 1.25,
  },
  tick: {
    position: 'absolute',
    width: 2,
    height: 4,
    borderRadius: 1,
    alignSelf: 'center',
  },
  tickWide: {
    position: 'absolute',
    width: 4,
    height: 2,
    borderRadius: 1,
    top: '50%',
    marginTop: -1,
  },
  eyeRow: {
    position: 'absolute',
    top: '34%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  eyeCluster: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeGlow: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  eye: {
    width: 7,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 5,
    elevation: 3,
  },
  eyeDot: {
    position: 'absolute',
    top: 2,
    left: 3,
    width: 2.5,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: '#1A1208',
  },
});
