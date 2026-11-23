/**
 * The soft pulsing light behind the mascot on the welcome beat. Still, and half bright, with Reduce Motion.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { useReduceMotion } from '../../../shared/ui/useReduceMotion';

export function WelcomeGlow({ active }: { active: boolean }) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      glow.setValue(0);
      return;
    }
    if (reduceMotion) {
      glow.setValue(0.5);
      return;
    }
    const pulse = (toValue: number) =>
      Animated.timing(glow, {
        toValue,
        duration: 1800,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    const loop = Animated.loop(Animated.sequence([pulse(1), pulse(0)]));
    loop.start();
    return () => loop.stop();
  }, [active, glow, reduceMotion]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.glow,
        {
          backgroundColor: theme.percent,
          opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.22] }),
          transform: [
            { scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.12] }) },
          ],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
});
