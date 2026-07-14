/**
 * In-screen Ember dock for places the global companion can’t reach
 * (e.g. React Native Modal add-task sheet).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ember, Text } from '../../ui';
import {
  Spacing,
  useTheme,
  Shadows,
  pickEmberTip,
  emberTipPoolForRoute,
  type EmberInsight,
} from '../../theme';
import { useObserveTimeState, usePresenceStreak, useReduceMotion } from '../../hooks';
import {
  hasEmberIntroBeenShown,
  markEmberIntroShown,
  nextEmberTipIndex,
  setEmberTipIndex,
} from '../../services/emberCompanionMemory';

type EmberLocalDockProps = {
  /** Tip pool key, e.g. DailyTasks */
  place: string;
  /** Auto-open tip once per place if never shown. */
  autoIntro?: boolean;
};

const TIP_MS = 4800;

export function EmberLocalDock({
  place,
  autoIntro = true,
}: EmberLocalDockProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const { timeState } = useObserveTimeState();
  const { streak } = usePresenceStreak();
  const dayProgress = timeState.day ?? 0.35;

  const [insight, setInsight] = useState<EmberInsight | null>(null);
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enter = useRef(new Animated.Value(0)).current;
  const enterX = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const idle = useRef(new Animated.Value(0)).current;

  const ctx = { dayProgress, streakCount: streak.count };

  const clearHide = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const showTip = useCallback(
    (tip: EmberInsight, delay = 0) => {
      clearHide();
      const run = () => {
        setInsight(tip);
        setBubbleOpen(true);
        Animated.timing(bubbleOpacity, {
          toValue: 1,
          duration: reduceMotion ? 0 : 220,
          useNativeDriver: true,
        }).start();
        hideTimer.current = setTimeout(() => {
          Animated.timing(bubbleOpacity, {
            toValue: 0,
            duration: reduceMotion ? 0 : 180,
            useNativeDriver: true,
          }).start(({ finished }) => {
            if (finished) setBubbleOpen(false);
          });
        }, TIP_MS);
      };
      if (delay <= 0) run();
      else hideTimer.current = setTimeout(run, delay);
    },
    [bubbleOpacity, reduceMotion],
  );

  useEffect(() => {
    const pool = emberTipPoolForRoute(place, ctx);
    if (!pool) return;

    const style = place.length % 3;
    enter.setValue(0);
    if (reduceMotion) {
      enter.setValue(1);
      enterX.setValue(0);
    } else if (style === 0) {
      enterX.setValue(48);
      Animated.parallel([
        Animated.spring(enter, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(enterX, {
          toValue: 0,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (style === 1) {
      enterX.setValue(-36);
      spin.setValue(-0.4);
      Animated.parallel([
        Animated.timing(enter, {
          toValue: 1,
          duration: 560,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(enterX, {
          toValue: 0,
          duration: 560,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(spin, {
          toValue: 0,
          duration: 560,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      enterX.setValue(0);
      Animated.sequence([
        Animated.timing(enter, {
          toValue: 1.08,
          duration: 320,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(enter, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    if (!reduceMotion) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(idle, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(idle, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }

    if (autoIntro && !hasEmberIntroBeenShown(place)) {
      setEmberTipIndex(place, 0);
      markEmberIntroShown(place);
      const tip = pickEmberTip(place, ctx, 0);
      if (tip) showTip(tip, reduceMotion ? 0 : 240);
    } else {
      setInsight(pickEmberTip(place, ctx, 0));
    }

    return () => clearHide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place]);

  const onTap = useCallback(() => {
    const pool = emberTipPoolForRoute(place, ctx);
    if (!pool) return;
    const tip = pickEmberTip(
      place,
      ctx,
      nextEmberTipIndex(place, pool.length),
    );
    if (tip) showTip(tip, 0);
  }, [ctx, place, showTip]);

  if (!insight) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          right: Spacing[3],
          bottom: Math.max(insets.bottom, Spacing[3]) + Spacing[2],
          opacity: enter,
          transform: [
            { translateX: enterX },
            {
              translateY: Animated.add(
                enter.interpolate({
                  inputRange: [0, 1],
                  outputRange: [28, 0],
                }),
                idle.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -5],
                }),
              ),
            },
            { scale: enter },
            {
              rotate: spin.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: ['-50deg', '0deg', '50deg'],
              }),
            },
          ],
        },
      ]}
    >
      <Animated.View
        pointerEvents={bubbleOpen ? 'auto' : 'none'}
        style={[
          styles.bubble,
          {
            backgroundColor: theme.cardBaseAlpha,
            borderColor: theme.glassBorder,
            opacity: bubbleOpacity,
          },
          Shadows.glass,
        ]}
      >
        <Pressable onPress={() => {
          clearHide();
          Animated.timing(bubbleOpacity, {
            toValue: 0,
            duration: 140,
            useNativeDriver: true,
          }).start(() => setBubbleOpen(false));
        }}>
          <Text variant="micro" color="secondary" style={styles.eyebrow}>
            {insight.eyebrow}
          </Text>
          <Text variant="caption" color="primary" style={styles.body}>
            {insight.body}
          </Text>
        </Pressable>
      </Animated.View>
      <Ember progress={dayProgress} size={42} interactive onInteract={onTap} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    zIndex: 50,
    maxWidth: 210,
    alignItems: 'flex-end',
    ...Platform.select({ android: { elevation: 12 }, default: {} }),
  },
  bubble: {
    marginBottom: Spacing[2],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 190,
  },
  eyebrow: {
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  body: { lineHeight: 17 },
});
