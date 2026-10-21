/**
 * Age confirmation state for the sign-in screens: the checkbox value plus the "tick this first"
 * nudge (shake, hint, screen-reader announcement) shown when someone taps a sign-in button early.
 */

import { useCallback, useRef, useState } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';
import { useReduceMotion } from '../../../shared/ui';
import { MINIMUM_ACCOUNT_AGE_YEARS } from '../domain/ageGate';

const SHAKE_STEPS = [8, -8, 6, -6, 3, 0] as const;

export function useAgeConfirmation<Source extends string = string>(
  onBlocked?: (source: Source) => void,
) {
  const reduceMotion = useReduceMotion();
  const [confirmed, setConfirmedState] = useState(false);
  const [nudge, setNudge] = useState(false);
  const shakeX = useRef(new Animated.Value(0)).current;

  const setConfirmed = useCallback((next: boolean) => {
    setConfirmedState(next);
    if (next) setNudge(false);
  }, []);

  /** True when the person confirmed their age; otherwise points at the checkbox and returns false. */
  const ensureConfirmed = useCallback(
    (source: Source): boolean => {
      if (confirmed) return true;
      setNudge(true);
      onBlocked?.(source);
      AccessibilityInfo.announceForAccessibility(
        `Confirm you're ${MINIMUM_ACCOUNT_AGE_YEARS} or older first.`,
      );
      if (!reduceMotion) {
        shakeX.setValue(0);
        Animated.sequence(
          SHAKE_STEPS.map(toValue =>
            Animated.timing(shakeX, {
              toValue,
              duration: 50,
              useNativeDriver: true,
            }),
          ),
        ).start();
      }
      return false;
    },
    [confirmed, onBlocked, reduceMotion, shakeX],
  );

  return { confirmed, nudge, shakeX, setConfirmed, ensureConfirmed };
}
