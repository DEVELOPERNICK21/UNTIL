/**
 * Traveling Ember companion —
 * unique flight styles per hop, smooth landings, soft idle presence.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ember, Text } from '../../ui';
import {
  Spacing,
  useTheme,
  Shadows,
  emberSupportsRoute,
  type EmberInsight,
} from '../../theme';
import {
  useObserveTimeState,
  useReduceMotion,
  usePresenceStreak,
  useOnboardingQuizAnswers,
} from '../../hooks';
import { rootNavigationRef } from '../../navigation/rootNavigationRef';
import {
  hasEmberIntroBeenShown,
  markEmberIntroShown,
  nextEmberTipIndex,
  setEmberTipIndex,
} from '../../services/emberCompanionMemory';
import {
  getEmberSurfaceState,
  resolveEmberPlace,
  subscribeEmberSurface,
} from '../../services/emberSurface';
import {
  planEmberEnter,
  planEmberExit,
  type EmberFlightPlan,
} from './emberFlight';
import { mergedEmberTipPool, pickMergedEmberTip } from './emberPersonalization';

type EmberCompanionProps = {
  suppressed?: boolean;
};

function readNavRoute(): string | undefined {
  if (!rootNavigationRef.isReady()) return undefined;
  return rootNavigationRef.getCurrentRoute()?.name;
}

function readPlace(): string | undefined {
  return resolveEmberPlace(readNavRoute());
}

const TIP_MS = 4800;

export function EmberCompanion({ suppressed = false }: EmberCompanionProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const { timeState } = useObserveTimeState();
  const { streak } = usePresenceStreak();
  const quizAnswers = useOnboardingQuizAnswers();
  const dayProgress = timeState.day ?? 0.35;

  const [insight, setInsight] = useState<EmberInsight | null>(null);
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [docked, setDocked] = useState(false);
  const [flightTrail, setFlightTrail] = useState(false);
  const [trailKind, setTrailKind] = useState<'soft' | 'bright' | 'spark'>(
    'soft',
  );
  const [showTapHint, setShowTapHint] = useState(false);
  const [modalCovering, setModalCovering] = useState(
    () => getEmberSurfaceState().modalCovering,
  );

  const flight = useRef(new Animated.Value(1)).current;
  const driftX = useRef(new Animated.Value(0)).current;
  const driftY = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const trailPulse = useRef(new Animated.Value(0)).current;
  const idleFloat = useRef(new Animated.Value(0)).current;
  const landSquash = useRef(new Animated.Value(1)).current;

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flightLock = useRef(false);
  const prevRoute = useRef<string | undefined>(undefined);
  const firstPaint = useRef(true);
  const pendingRoute = useRef<string | undefined>(undefined);
  const activeRoute = useRef<string | undefined>(undefined);
  const idleLoop = useRef<Animated.CompositeAnimation | null>(null);

  const ctxRef = useRef({ dayProgress, streakCount: streak.count });
  ctxRef.current = { dayProgress, streakCount: streak.count };

  const quizAnswersRef = useRef(quizAnswers);
  quizAnswersRef.current = quizAnswers;
  const reduceMotionRef = useRef(reduceMotion);
  reduceMotionRef.current = reduceMotion;
  const screenWRef = useRef(screenW);
  screenWRef.current = screenW;

  const clearHideTimer = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const stopIdle = () => {
    idleLoop.current?.stop();
    idleLoop.current = null;
    idleFloat.setValue(0);
  };

  const startIdle = useCallback(() => {
    stopIdle();
    if (reduceMotionRef.current) return;
    idleLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(idleFloat, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(idleFloat, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    idleLoop.current.start();
  }, [idleFloat]);

  const hideBubble = useCallback(() => {
    clearHideTimer();
    Animated.timing(bubbleOpacity, {
      toValue: 0,
      duration: reduceMotionRef.current ? 0 : 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setBubbleOpen(false);
      setShowTapHint(false);
    });
  }, [bubbleOpacity]);

  const showInsightBubble = useCallback(
    (tip: EmberInsight, delayMs: number = 120, withHint = false) => {
      clearHideTimer();
      const show = () => {
        setInsight(tip);
        setShowTapHint(withHint);
        setBubbleOpen(true);
        Animated.timing(bubbleOpacity, {
          toValue: 1,
          duration: reduceMotionRef.current ? 0 : 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
        hideTimer.current = setTimeout(() => {
          Animated.timing(bubbleOpacity, {
            toValue: 0,
            duration: reduceMotionRef.current ? 0 : 220,
            useNativeDriver: true,
          }).start(({ finished }) => {
            if (finished) {
              setBubbleOpen(false);
              setShowTapHint(false);
            }
          });
        }, TIP_MS);
      };
      if (delayMs <= 0) show();
      else hideTimer.current = setTimeout(show, delayMs);
    },
    [bubbleOpacity],
  );

  const resolveTip = useCallback((route: string, advance: boolean) => {
    const pool = mergedEmberTipPool(route, ctxRef.current, quizAnswersRef.current);
    if (!pool || pool.length === 0) return null;
    const index = advance ? nextEmberTipIndex(route, pool.length) : 0;
    if (!advance) setEmberTipIndex(route, 0);
    return pickMergedEmberTip(route, ctxRef.current, index, quizAnswersRef.current);
  }, []);

  const playEnter = useCallback(
    (plan: EmberFlightPlan, onDone: () => void) => {
      const calm = reduceMotionRef.current;
      setTrailKind(plan.trail);
      setFlightTrail(!calm);
      stopIdle();

      driftX.setValue(plan.startX);
      driftY.setValue(plan.startY);
      flight.setValue(0);
      spin.setValue(0);
      landSquash.setValue(1);
      trailPulse.setValue(0);

      if (calm) {
        flight.setValue(1);
        driftX.setValue(0);
        driftY.setValue(0);
        onDone();
        return;
      }

      const d = plan.durationMs;
      const trailLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(trailPulse, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(trailPulse, {
            toValue: 0,
            duration: 280,
            useNativeDriver: true,
          }),
        ]),
      );
      trailLoop.start();

      const moveY =
        plan.style === 'cascade'
          ? Animated.sequence([
              Animated.timing(driftY, {
                toValue: plan.midY,
                duration: d * 0.55,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(driftY, {
                toValue: 0,
                duration: d * 0.45,
                easing: Easing.out(Easing.back(1.4)),
                useNativeDriver: true,
              }),
            ])
          : plan.style === 'arc' || plan.style === 'comet'
            ? Animated.sequence([
                Animated.timing(driftY, {
                  toValue: plan.midY,
                  duration: d * 0.5,
                  easing: Easing.out(Easing.cubic),
                  useNativeDriver: true,
                }),
                Animated.timing(driftY, {
                  toValue: 0,
                  duration: d * 0.5,
                  easing: Easing.inOut(Easing.sin),
                  useNativeDriver: true,
                }),
              ])
            : Animated.timing(driftY, {
                toValue: 0,
                duration: d,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              });

      const moveX =
        plan.style === 'zip'
          ? Animated.sequence([
              Animated.timing(driftX, {
                toValue: plan.midX,
                duration: d * 0.65,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.timing(driftX, {
                toValue: 0,
                duration: d * 0.35,
                easing: Easing.out(Easing.back(1.6)),
                useNativeDriver: true,
              }),
            ])
          : plan.style === 'spiral'
            ? Animated.sequence([
                Animated.timing(driftX, {
                  toValue: plan.midX,
                  duration: d * 0.55,
                  easing: Easing.inOut(Easing.sin),
                  useNativeDriver: true,
                }),
                Animated.timing(driftX, {
                  toValue: 0,
                  duration: d * 0.45,
                  easing: Easing.out(Easing.cubic),
                  useNativeDriver: true,
                }),
              ])
            : Animated.timing(driftX, {
                toValue: 0,
                duration: d,
                easing:
                  plan.style === 'drift'
                    ? Easing.inOut(Easing.sin)
                    : Easing.out(Easing.cubic),
                useNativeDriver: true,
              });

      Animated.parallel([
        Animated.timing(flight, {
          toValue: 1,
          duration: d,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        moveX,
        moveY,
        Animated.timing(spin, {
          toValue: plan.spinTo,
          duration: d,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        trailLoop.stop();
        trailPulse.setValue(0);
        // Soft land squash
        Animated.sequence([
          Animated.timing(landSquash, {
            toValue: 0.9,
            duration: 90,
            useNativeDriver: true,
          }),
          Animated.timing(landSquash, {
            toValue: 1.04,
            duration: 120,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(landSquash, {
            toValue: 1,
            duration: 140,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setFlightTrail(false);
          spin.setValue(0);
          startIdle();
          onDone();
        });
      });
    },
    [driftX, driftY, flight, landSquash, spin, startIdle, trailPulse],
  );

  const playExit = useCallback(
    (onDone: () => void) => {
      const calm = reduceMotionRef.current;
      const plan = planEmberExit(screenWRef.current);
      stopIdle();
      setFlightTrail(!calm);
      clearHideTimer();

      if (calm) {
        onDone();
        return;
      }

      Animated.parallel([
        Animated.timing(bubbleOpacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(flight, {
          toValue: 0,
          duration: plan.durationMs,
          easing:
            plan.style === 'pop'
              ? Easing.in(Easing.back(1.4))
              : Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(driftX, {
          toValue: plan.endX,
          duration: plan.durationMs,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(driftY, {
          toValue: plan.endY,
          duration: plan.durationMs,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(spin, {
          toValue: plan.spinTo,
          duration: plan.durationMs,
          useNativeDriver: true,
        }),
        Animated.timing(trailPulse, {
          toValue: 1,
          duration: plan.durationMs,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setBubbleOpen(false);
        setFlightTrail(false);
        onDone();
      });
    },
    [bubbleOpacity, driftX, driftY, flight, spin, trailPulse],
  );

  const flyToRoute = useCallback(
    (name: string | undefined) => {
      if (flightLock.current) {
        pendingRoute.current = name;
        return;
      }
      if (name === prevRoute.current) return;

      const arriving = emberSupportsRoute(name);
      const leaving =
        prevRoute.current != null && emberSupportsRoute(prevRoute.current);
      const calm = reduceMotionRef.current;

      const finishPending = () => {
        flightLock.current = false;
        if (pendingRoute.current !== undefined) {
          const queued = pendingRoute.current;
          pendingRoute.current = undefined;
          if (queued !== prevRoute.current) flyToRoute(queued);
        }
      };

      const afterLand = (route: string) => {
        activeRoute.current = route;
        const firstVisit = !hasEmberIntroBeenShown(route);
        if (firstVisit) {
          const tip = resolveTip(route, false);
          markEmberIntroShown(route);
          if (tip) showInsightBubble(tip, calm ? 0 : 220, true);
          else setInsight(pickMergedEmberTip(route, ctxRef.current, 0, quizAnswersRef.current));
        } else {
          setInsight(
            pickMergedEmberTip(route, ctxRef.current, 0, quizAnswersRef.current) ?? {
              eyebrow: 'Ember',
              body: 'Tap me when you want a tip.',
            },
          );
          setBubbleOpen(false);
          setShowTapHint(false);
          bubbleOpacity.setValue(0);
        }
      };

      const settleIn = () => {
        if (!name || !arriving) {
          finishPending();
          return;
        }
        prevRoute.current = name;
        setDocked(true);
        setInsight(pickMergedEmberTip(name, ctxRef.current, 0, quizAnswersRef.current));
        flightLock.current = true;
        bubbleOpacity.setValue(0);
        setBubbleOpen(false);

        const plan = planEmberEnter(screenWRef.current);
        playEnter(plan, () => {
          afterLand(name);
          finishPending();
        });
      };

      if (!arriving) {
        prevRoute.current = name;
        activeRoute.current = name;
        if (!leaving || calm) {
          clearHideTimer();
          setBubbleOpen(false);
          bubbleOpacity.setValue(0);
          setInsight(null);
          setDocked(false);
          stopIdle();
          flight.setValue(1);
          driftX.setValue(0);
          driftY.setValue(0);
          spin.setValue(0);
          finishPending();
          return;
        }
        flightLock.current = true;
        playExit(() => {
          setInsight(null);
          setDocked(false);
          flight.setValue(1);
          driftX.setValue(0);
          driftY.setValue(0);
          spin.setValue(0);
          trailPulse.setValue(0);
          finishPending();
        });
        return;
      }

      if (firstPaint.current || calm || !leaving) {
        firstPaint.current = false;
        settleIn();
        return;
      }

      flightLock.current = true;
      playExit(() => settleIn());
    },
    [
      bubbleOpacity,
      driftX,
      driftY,
      flight,
      playEnter,
      playExit,
      resolveTip,
      showInsightBubble,
      spin,
      trailPulse,
    ],
  );

  useEffect(() => {
    const sync = () => {
      setModalCovering(getEmberSurfaceState().modalCovering);
      flyToRoute(readPlace());
    };
    sync();
    const unsubNav = rootNavigationRef.addListener('state', sync);
    const unsubSurface = subscribeEmberSurface(sync);
    return () => {
      unsubNav();
      unsubSurface();
      clearHideTimer();
      stopIdle();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onEmberInteract = useCallback(() => {
    const route = activeRoute.current ?? readPlace();
    if (!route || !emberSupportsRoute(route)) return;
    const tip = resolveTip(route, true);
    if (tip) showInsightBubble(tip, 0, true);
  }, [resolveTip, showInsightBubble]);

  const visible = !suppressed && !modalCovering && docked && insight != null;
  if (!visible || !insight) {
    return null;
  }

  const scale = Animated.multiply(
    flight.interpolate({
      inputRange: [0, 1],
      outputRange: [0.42, 1],
    }),
    landSquash,
  );
  const opacity = flight.interpolate({
    inputRange: [0, 0.12, 1],
    outputRange: [0, 0.92, 1],
  });
  const rotate = spin.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-120deg', '0deg', '420deg'],
  });
  const idleY = idleFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });
  const trailOpacity = trailPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, trailKind === 'bright' ? 0.85 : 0.55],
  });
  const trailScale = trailPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, trailKind === 'spark' ? 1.35 : 1.1],
  });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          right: Spacing[3],
          bottom: Math.max(insets.bottom, Spacing[3]) + 72,
          zIndex: 80,
          elevation: 80,
          opacity,
          transform: [
            { translateX: driftX },
            { translateY: Animated.add(driftY, idleY) },
            { scale: scale as unknown as number },
            { rotate },
          ],
        },
      ]}
    >
      {flightTrail ? (
        <>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.trail,
              styles.trailMain,
              {
                backgroundColor:
                  trailKind === 'bright' ? theme.percent : theme.glassHighlight,
                opacity: trailOpacity,
                transform: [{ scale: trailScale }],
              },
            ]}
          />
          {trailKind === 'spark' ? (
            <>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.trail,
                  styles.trailSparkA,
                  {
                    backgroundColor: theme.percent,
                    opacity: trailOpacity,
                  },
                ]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.trail,
                  styles.trailSparkB,
                  {
                    backgroundColor: '#FFFFFF',
                    opacity: trailOpacity,
                  },
                ]}
              />
            </>
          ) : null}
        </>
      ) : null}

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
        <Pressable onPress={hideBubble} hitSlop={8}>
          <Text variant="micro" color="secondary" style={styles.eyebrow}>
            {insight.eyebrow}
          </Text>
          <Text variant="caption" color="primary" style={styles.body}>
            {insight.body}
          </Text>
          {showTapHint ? (
            <Text variant="micro" color="secondary" style={styles.hint}>
              Tap again for another whisper
            </Text>
          ) : null}
        </Pressable>
      </Animated.View>

      <View style={styles.emberHit}>
        <Ember
          progress={dayProgress}
          size={42}
          interactive
          onInteract={onEmberInteract}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    zIndex: 80,
    maxWidth: 220,
    alignItems: 'flex-end',
    ...Platform.select({
      android: { elevation: 10 },
      default: {},
    }),
  },
  trail: {
    position: 'absolute',
    borderRadius: 99,
  },
  trailMain: {
    right: 20,
    bottom: 16,
    width: 20,
    height: 20,
  },
  trailSparkA: {
    right: 38,
    bottom: 28,
    width: 8,
    height: 8,
  },
  trailSparkB: {
    right: 10,
    bottom: 36,
    width: 6,
    height: 6,
  },
  bubble: {
    marginBottom: Spacing[2],
    marginRight: Spacing[1],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 200,
  },
  eyebrow: {
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  body: {
    lineHeight: 17,
  },
  hint: {
    marginTop: 6,
    opacity: 0.65,
  },
  emberHit: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
