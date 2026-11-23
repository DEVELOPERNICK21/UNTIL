import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useReduceMotion } from '../../../shared/ui/useReduceMotion';

/** Lets each step arrive softly instead of snapping in. With Reduce Motion it is just there. */
export function FadeIn({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReduceMotion();
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      return;
    }
    Animated.timing(opacity, { toValue: 1, duration: 420, useNativeDriver: true }).start();
  }, [opacity, reduceMotion]);

  return <Animated.View style={[styles.fill, { opacity }]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
