import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { BREATH_PACES, type BreathPaceName } from '../domain/breathing';

/** Smallest the orb gets when the lungs are empty, as a share of its full size. */
const EMPTY_SCALE = 0.58;
/** Where the orb rests when Reduce Motion is on: still, and between full and empty. */
const REST_SCALE = 0.8;

interface Props {
  pace: BreathPaceName;
  reduceMotion: boolean;
  size: number;
}

/**
 * The circle that swells as you breathe in and settles as you breathe out. Three soft layers of the
 * app's warm accent, no hard edges. It only scales (on the native driver), so it stays smooth on slow
 * phones. With Reduce Motion it stays still and the words carry the rhythm.
 */
export function BreathOrb({ pace, reduceMotion, size }: Props) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(reduceMotion ? REST_SCALE : EMPTY_SCALE)).current;

  useEffect(() => {
    if (reduceMotion) {
      scale.setValue(REST_SCALE);
      return undefined;
    }
    const timing = BREATH_PACES[pace];
    scale.setValue(EMPTY_SCALE);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1,
          duration: timing.inhaleMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: EMPTY_SCALE,
          duration: timing.exhaleMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pace, reduceMotion, scale]);

  const layer = (ratio: number, opacity: number) => ({
    width: size * ratio,
    height: size * ratio,
    borderRadius: (size * ratio) / 2,
    backgroundColor: theme.percent,
    opacity,
  });

  return (
    <Animated.View
      style={[styles.orb, { width: size, height: size, transform: [{ scale }] }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.layer, layer(1, 0.1)]} />
      <View style={[styles.layer, layer(0.78, 0.18)]} />
      <View style={[styles.layer, layer(0.54, 0.34)]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  orb: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  layer: {
    position: 'absolute',
  },
});
