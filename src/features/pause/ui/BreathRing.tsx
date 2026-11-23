import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { BREATH_TECHNIQUES, type BreathTechniqueId } from '../domain/breathing';
import { CalmText } from './CalmText';
import { CALM } from './calmPalette';

/** Smallest the orb gets when the lungs are empty, as a share of its full size. */
const EMPTY_SCALE = 0.5;
/** Where the orb rests when Reduce Motion is on. */
const REST_SCALE = 0.78;
const STROKE = 5;

const scaleFor = (fullness: number) => EMPTY_SCALE + (1 - EMPTY_SCALE) * fullness;

interface Props {
  technique: BreathTechniqueId;
  reduceMotion: boolean;
  size: number;
  /** 0 to 1 through the whole session: the ring fills as the minutes pass. */
  progress: number;
  /** Whole seconds left in this part of the breath. Shown in the middle so 4-7-8 and box can be counted. */
  secondsLeft: number;
}

/**
 * A ring that fills as the session goes, with a glowing orb inside that swells as you breathe in, holds,
 * and settles as you breathe out. The orb only scales (on the native driver) so it stays smooth on slow
 * phones. With Reduce Motion it stays still and the words and the number carry the rhythm.
 */
export function BreathRing({ technique, reduceMotion, size, progress, secondsLeft }: Props) {
  const scale = useRef(new Animated.Value(reduceMotion ? REST_SCALE : EMPTY_SCALE)).current;

  useEffect(() => {
    if (reduceMotion) {
      scale.setValue(REST_SCALE);
      return undefined;
    }
    scale.setValue(EMPTY_SCALE);
    const loop = Animated.loop(
      Animated.sequence(
        BREATH_TECHNIQUES[technique].map(phase =>
          Animated.timing(scale, {
            toValue: scaleFor(phase.to),
            duration: phase.ms,
            // A hold stays put; everything else eases like a breath.
            easing: phase.from === phase.to ? Easing.linear : Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ),
      ),
    );
    loop.start();
    return () => loop.stop();
  }, [technique, reduceMotion, scale]);

  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const inner = size - STROKE * 2 - 20;
  const layer = (ratio: number, opacity: number) => ({
    width: inner * ratio,
    height: inner * ratio,
    borderRadius: (inner * ratio) / 2,
    backgroundColor: CALM.orb,
    opacity,
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={CALM.track} strokeWidth={STROKE} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={CALM.accent}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - progress)}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <Animated.View
        style={[styles.orb, { transform: [{ scale }] }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={[styles.layer, layer(1, 0.14)]} />
        <View style={[styles.layer, layer(0.76, 0.24)]} />
        <View style={[styles.layer, layer(0.5, 0.5)]} />
      </Animated.View>

      {secondsLeft > 0 ? (
        <View style={styles.number} pointerEvents="none">
          <CalmText variant="display" tone="primary" style={styles.numberText}>
            {secondsLeft}
          </CalmText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layer: {
    position: 'absolute',
  },
  number: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    opacity: 0.9,
  },
});
