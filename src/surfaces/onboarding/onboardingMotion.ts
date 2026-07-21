/**
 * Shared motion helpers for interactive onboarding beats.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { useReduceMotion } from '../../hooks';

export function useLiveDayClock(enabled: boolean) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [enabled]);

  return useMemo(() => {
    const date = new Date(now);
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const total = end.getTime() - start.getTime();
    const elapsed = Math.min(total, Math.max(0, now - start.getTime()));
    const remaining = Math.max(0, end.getTime() - now);
    const progress = total > 0 ? elapsed / total : 0;
    const remH = Math.floor(remaining / (1000 * 60 * 60));
    const remM = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const remS = Math.floor((remaining % (1000 * 60)) / 1000);
    return {
      progress,
      percentDone: Math.round(progress * 100),
      remainingLabel: `${remH}h ${remM}m ${remS}s`,
    };
  }, [now]);
}

export function useEnter(active: boolean, delay = 0) {
  const reduceMotion = useReduceMotion();
  const opacity = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(22)).current;

  useEffect(() => {
    if (!active) {
      opacity.setValue(0);
      y.setValue(reduceMotion ? 0 : 22);
      return;
    }
    if (reduceMotion) {
      opacity.setValue(1);
      y.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 520,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(y, {
        toValue: 0,
        duration: 560,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [active, delay, opacity, y, reduceMotion]);

  return { opacity, transform: [{ translateY: y }] };
}

export function useCtaPressScale() {
  const reduceMotion = useReduceMotion();
  const scale = useRef(new Animated.Value(1)).current;

  const bounce = () => {
    if (reduceMotion) return;
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return { scale, bounce };
}

export const DAY_PASSED = '#EF4444';
export const DAY_LEFT = '#22C55E';
