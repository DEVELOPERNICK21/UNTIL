import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
  AccessibilityInfo,
  AppState,
  Text as RNText,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import type { ProgressBand } from '../theme/emotionalCopy';
import { getFontFamilyForWeight, Weight } from '../theme';
import { subscribeEmberReactions } from './emberReactions';
import { useReduceMotion } from './useReduceMotion';
import {
  MAX_SPARKS,
  dayRingAngle,
  emberVitals,
  nextAngle,
  phaseKeyframes,
  timeLeftLabel,
  waveKeyframes,
} from './emberTime';

export type EmberMood = ProgressBand;

type EmberProps = {
  /** Day progress 0–1. Drives mood, the day ring, and how bright Ember burns. */
  progress?: number;
  mood?: EmberMood;
  size?: number;
  animated?: boolean;
  /** Tap, hold and drag all work. Default true. */
  interactive?: boolean;
  /** Stop every loop, e.g. while the screen is covered. Ember keeps its pose. */
  paused?: boolean;
  /** Hop and sparkle when the app says something good happened (task done, badge earned). */
  reactive?: boolean;
  /** Called when the user taps Ember (after the reaction starts). */
  onInteract?: () => void;
  /**
   * Called when the user holds Ember, with how much of today is left. When missing, Ember shows
   * the answer in its own small bubble.
   */
  onLongPress?: (timeLeft: string) => void;
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

/** The app's colour for time that has already gone. */
const PASSED = '#BB86FC';
/** The brass of the cradle and the runes. Stays the same all day; the gem changes colour. */
const BRASS = { hi: '#F8DC8E', mid: '#D9A441', deep: '#7A5314' };

/** Everything in the dial is drawn on a 100 unit square. */
const DIAL = 100;
const DAY_R = 47;
const DAY_LEN = 2 * Math.PI * DAY_R;
const RUNE_R = 39;
const DASH_R = 34;
const DASH_PERIOD = (2 * Math.PI * DASH_R) / 36;
const RUNE_SLOTS = 12;
/** Lid size when open. 1 covers the whole gem. */
const LID_OPEN = 0.07;
const BURST_COUNT = 8;
/** Smallest Ember that also draws the counter-turning dash ring. */
const DASH_MIN_SIZE = 46;

type Expression = 'idle' | 'happy' | 'wink' | 'wow' | 'yawn' | 'sleepy';

const TAP_REACTIONS = ['happy', 'spin', 'tick', 'wink'] as const;

let emberCounter = 0;

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

function useAppActive(): boolean {
  const [active, setActive] = useState(
    () => !AppState.currentState || AppState.currentState === 'active',
  );
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      setActive(state === 'active');
    });
    return () => sub.remove();
  }, []);
  return active;
}

/** One rune. Three shapes repeat, so the ring looks the same every 90 degrees and can turn forever. */
function runePath(kind: number): string {
  if (kind === 0) return 'M50 6 L52.6 10.2 L50 14.4 L47.4 10.2 Z';
  if (kind === 1) return 'M50 5.6 L53.4 13.4 L46.6 13.4 Z';
  return 'M49.2 5.8 H50.8 V9 H49.2 Z M49.2 11.4 H50.8 V14.4 H49.2 Z';
}

/**
 * Ember, a living time stone.
 *
 * A gem sits in an eye-shaped brass cradle. Rune rings turn slowly in opposite directions and a
 * ring around them is your day: violet is gone, bright is still ahead, the white dot is now. The
 * eyelids lift when Ember wakes and close over the gem late at night. The gem burns a little
 * smaller each hour, and its sparks rise like fire in the morning and fall like sand in the
 * evening. Tap it, hold it to rewind the dial and hear the time left, or drag a finger near it and
 * it watches.
 */
export function Ember({
  progress = 0.35,
  mood: moodProp,
  size = 56,
  animated = true,
  interactive = true,
  paused = false,
  reactive = false,
  onInteract,
  onLongPress,
}: EmberProps) {
  const reduceMotion = useReduceMotion();
  const appActive = useAppActive();
  const vitals = useMemo(
    () => emberVitals(progress, moodProp),
    [progress, moodProp],
  );
  const { mood, left, sleepy } = vitals;
  const colors = MOOD_COLOR[mood];
  const shouldAnimate = animated && !reduceMotion && !paused && appActive;
  const motionOk = !reduceMotion;

  const uid = useRef(`ember-${++emberCounter}`).current;
  const u = size / 64;
  const stage = Math.round(size * 1.55);
  const dialBox = size * 1.32;
  const detailed = size >= DASH_MIN_SIZE;
  /** Lids rest closed a little when Ember is sleepy. */
  const restingLid = sleepy ? 0.42 : 0;

  // One slow driver per kind of motion. Everything else is a keyframe list on top of these.
  const life = useRef(new Animated.Value(0)).current;
  const sparkClock = useRef(new Animated.Value(0)).current;
  const blinkL = useRef(new Animated.Value(1)).current;
  const blinkR = useRef(new Animated.Value(1)).current;
  const lookX = useRef(new Animated.Value(0)).current;
  const lookY = useRef(new Animated.Value(0)).current;
  const hop = useRef(new Animated.Value(0)).current;
  const tap = useRef(new Animated.Value(1)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const ringGlow = useRef(new Animated.Value(0)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const headDeg = useRef(new Animated.Value(0)).current;
  const runeBoost = useRef(new Animated.Value(0)).current;
  /** 0 is open, 1 is shut tight. */
  const lid = useRef(new Animated.Value(1)).current;

  const headAngle = useRef<number | null>(null);
  const revealed = useRef(false);

  const [override, setOverride] = useState<Expression | null>(null);
  const [bursting, setBursting] = useState(false);
  const [burstPower, setBurstPower] = useState(1);
  const [burstInward, setBurstInward] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const expression: Expression = override ?? (sleepy ? 'sleepy' : 'idle');

  const active = useRef(new Set<Animated.CompositeAnimation>()).current;
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>()).current;
  const exprTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const busyUntil = useRef(0);
  const touching = useRef(false);
  const tapIndex = useRef(0);
  const tapTimes = useRef<number[]>([]);
  const lastExcited = useRef(0);
  const vitalsRef = useRef(vitals);
  vitalsRef.current = vitals;
  const restingLidRef = useRef(restingLid);
  restingLidRef.current = restingLid;
  const stageRef = useRef<View>(null);
  const center = useRef<{ x: number; y: number } | null>(null);
  const lastTouch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      active.forEach(a => a.stop());
      active.clear();
      timers.forEach(t => clearTimeout(t));
      timers.clear();
      if (exprTimer.current) clearTimeout(exprTimer.current);
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    };
  }, [active, timers]);

  const later = useCallback(
    (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        timers.delete(id);
        if (mounted.current) fn();
      }, ms);
      timers.add(id);
      return id;
    },
    [timers],
  );

  const play = useCallback(
    (anim: Animated.CompositeAnimation, onDone?: () => void) => {
      active.add(anim);
      anim.start(({ finished }) => {
        active.delete(anim);
        if (finished && mounted.current) onDone?.();
      });
    },
    [active],
  );

  const to = useCallback(
    (
      value: Animated.Value,
      toValue: number,
      duration: number,
      easing: (t: number) => number = Easing.inOut(Easing.sin),
    ) =>
      Animated.timing(value, {
        toValue,
        duration,
        easing,
        useNativeDriver: true,
      }),
    [],
  );

  const showExpression = useCallback((next: Expression, ms: number) => {
    setOverride(next);
    if (exprTimer.current) clearTimeout(exprTimer.current);
    exprTimer.current = setTimeout(() => {
      if (mounted.current) setOverride(null);
    }, ms);
  }, []);

  // --- Loops: float, breathe, eye glow, rune rings, sparks ------------------------------------
  useEffect(() => {
    life.setValue(0);
    sparkClock.setValue(0);
    if (!shouldAnimate) return;
    const lifeLoop = Animated.loop(
      Animated.timing(life, {
        toValue: 1,
        duration: sleepy ? 14400 : 9600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const sparkLoop = Animated.loop(
      Animated.timing(sparkClock, {
        toValue: 1,
        duration: vitals.sparksFall ? 5600 : 4200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    lifeLoop.start();
    sparkLoop.start();
    return () => {
      lifeLoop.stop();
      sparkLoop.stop();
    };
  }, [shouldAnimate, sleepy, vitals.sparksFall, life, sparkClock]);

  // --- The eyelids: open when Ember wakes, half shut when it is sleepy ------------------------
  useEffect(() => {
    if (!revealed.current) {
      revealed.current = true;
      if (!shouldAnimate) {
        lid.setValue(restingLidRef.current);
        return;
      }
      // First time on screen: start shut and lift, like the amulet waking.
      lid.setValue(1);
      later(() => play(to(lid, restingLidRef.current, 760, Easing.out(Easing.cubic))), 260);
      return;
    }
    if (!motionOk) {
      lid.setValue(restingLid);
      return;
    }
    play(to(lid, restingLid, 900));
  }, [restingLid, shouldAnimate, motionOk, lid, later, play, to]);

  // --- The "now" dot follows the time of day ---------------------------------------------------
  useEffect(() => {
    const target = dayRingAngle(progress);
    const first = headAngle.current === null;
    const next = nextAngle(headAngle.current ?? target, target);
    headAngle.current = next;
    if (first || !motionOk) {
      headDeg.setValue(next);
      return;
    }
    play(to(headDeg, next, 700));
  }, [progress, motionOk, headDeg, to, play]);

  // --- Little behaviours ----------------------------------------------------------------------
  const doBlink = useCallback(
    (slow = false) => {
      const down = slow ? 160 : 90;
      const up = slow ? 280 : 130;
      const one = (v: Animated.Value) =>
        Animated.sequence([
          to(v, 0.12, down),
          Animated.delay(slow ? 260 : 0),
          to(v, 1, up),
        ]);
      play(Animated.parallel([one(blinkL), one(blinkR)]));
    },
    [blinkL, blinkR, play, to],
  );

  const doWink = useCallback(() => {
    showExpression('wink', 1000);
    play(
      Animated.sequence([
        to(blinkR, 0.1, 110),
        Animated.delay(420),
        to(blinkR, 1, 160),
      ]),
    );
  }, [blinkR, play, showExpression, to]);

  const doLook = useCallback(() => {
    const dir = Math.random() < 0.5 ? -1 : 1;
    play(
      Animated.sequence([
        Animated.parallel([
          to(lookX, 0.85 * dir, 240),
          to(lookY, -0.15, 240),
        ]),
        Animated.delay(520),
        to(lookX, -0.7 * dir, 300),
        Animated.delay(380),
        Animated.parallel([to(lookX, 0, 280), to(lookY, 0, 280)]),
      ]),
    );
  }, [lookX, lookY, play, to]);

  const doSway = useCallback(() => {
    play(
      Animated.sequence([
        to(sway, -1, 240),
        to(sway, 1, 340),
        to(sway, -0.6, 320),
        to(sway, 0.5, 280),
        to(sway, 0, 240),
      ]),
    );
  }, [play, sway, to]);

  const doHop = useCallback(
    (height = 0.12) => {
      play(
        Animated.parallel([
          Animated.sequence([
            to(hop, -size * height, 170, Easing.out(Easing.cubic)),
            to(hop, 0, 280, Easing.bounce),
          ]),
          Animated.sequence([
            to(tap, 1.12, 150, Easing.out(Easing.back(1.4))),
            to(tap, 1, 260),
          ]),
        ]),
      );
    },
    [hop, play, size, tap, to],
  );

  const doSpin = useCallback(
    (turns = 1) => {
      spin.setValue(0);
      play(
        Animated.sequence([
          to(spin, turns, 560 + 240 * turns, Easing.out(Easing.cubic)),
        ]),
        () => spin.setValue(0),
      );
    },
    [play, spin, to],
  );

  const doYawn = useCallback(() => {
    showExpression('yawn', 1700);
    play(
      Animated.parallel([
        Animated.sequence([
          Animated.parallel([to(blinkL, 0.22, 320), to(blinkR, 0.22, 320)]),
          Animated.delay(900),
          Animated.parallel([to(blinkL, 1, 320), to(blinkR, 1, 320)]),
        ]),
        Animated.sequence([
          to(lid, Math.max(0.45, restingLidRef.current), 420),
          Animated.delay(1000),
          to(lid, restingLidRef.current, 520),
        ]),
        Animated.sequence([to(tap, 1.08, 600), to(tap, 1, 700)]),
      ]),
    );
  }, [blinkL, blinkR, lid, play, showExpression, tap, to]);

  const doBurst = useCallback(
    (power = 1, inward = false) => {
      setBurstPower(power);
      setBurstInward(inward);
      setBursting(true);
      burst.setValue(0);
      play(to(burst, 1, inward ? 900 : 720, Easing.out(Easing.cubic)), () =>
        setBursting(false),
      );
    },
    [burst, play, to],
  );

  const doRingGlow = useCallback(() => {
    play(
      Animated.sequence([
        to(ringGlow, 1, 260),
        Animated.delay(1500),
        to(ringGlow, 0, 520),
      ]),
    );
  }, [play, ringGlow, to]);

  /** The rune rings whip round, once, as if the dial were being wound. */
  const doRuneSpin = useCallback(
    (degrees = 180) => {
      runeBoost.setValue(0);
      play(to(runeBoost, degrees, 1000, Easing.out(Easing.cubic)), () =>
        runeBoost.setValue(0),
      );
    },
    [play, runeBoost, to],
  );

  /** Hold: the "now" dot runs back to midnight and returns, while the runes unwind and sparks pull in. */
  const doRewind = useCallback(() => {
    const target = headAngle.current ?? 0;
    runeBoost.setValue(0);
    play(
      Animated.parallel([
        Animated.sequence([
          to(headDeg, 360 * Math.floor(target / 360), 520, Easing.in(Easing.cubic)),
          to(headDeg, target, 760, Easing.out(Easing.cubic)),
        ]),
        to(runeBoost, -360, 1100, Easing.out(Easing.cubic)),
        Animated.sequence([
          to(lid, 0, 200),
          Animated.delay(1500),
          to(lid, restingLidRef.current, 600),
        ]),
      ]),
      () => runeBoost.setValue(0),
    );
    doBurst(1.2, true);
  }, [doBurst, headDeg, lid, play, runeBoost, to]);

  const markBusy = useCallback((ms: number) => {
    busyUntil.current = Date.now() + ms;
  }, []);

  // Random blinks.
  useEffect(() => {
    if (!shouldAnimate) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      timer = setTimeout(
        () => {
          if (!alive) return;
          if (!touching.current) {
            const v = vitalsRef.current;
            if (v.sleepy) doBlink(true);
            else {
              doBlink();
              if (Math.random() < 0.25) later(() => doBlink(), 330);
            }
          }
          next();
        },
        2400 + Math.random() * 2800,
      );
    };
    next();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [shouldAnimate, doBlink, later]);

  // Idle things Ember does now and then. What it picks depends on the time of day.
  useEffect(() => {
    if (!shouldAnimate) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      timer = setTimeout(
        () => {
          if (!alive) return;
          if (!touching.current && Date.now() > busyUntil.current) {
            const v = vitalsRef.current;
            let pool: Array<() => void>;
            if (v.sleepy) pool = [doYawn, doLook, doSway];
            else if (v.waking) pool = [doYawn, doHop, doLook];
            else if (v.mood === 'dawn')
              pool = [() => doHop(), doLook, doWink, () => doRuneSpin(120)];
            else pool = [doLook, doSway, doWink, () => doRuneSpin(120)];
            pool[Math.floor(Math.random() * pool.length)]();
          }
          next();
        },
        (sleepy ? 9000 : 6000) + Math.random() * 5500,
      );
    };
    next();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [shouldAnimate, sleepy, doYawn, doLook, doSway, doWink, doHop, doRuneSpin]);

  // App tells Ember something good happened.
  useEffect(() => {
    if (!reactive) return;
    return subscribeEmberReactions(reaction => {
      if (!shouldAnimate) return;
      markBusy(1600);
      if (reaction === 'cheer') {
        showExpression('happy', 1500);
        doHop(0.16);
        doBurst(1.15);
        doRingGlow();
        doRuneSpin(180);
      } else {
        showExpression('wow', 1300);
        doSpin(1);
        doBurst(1.3);
      }
    });
  }, [
    reactive,
    shouldAnimate,
    markBusy,
    showExpression,
    doHop,
    doBurst,
    doRingGlow,
    doRuneSpin,
    doSpin,
  ]);

  // --- Touch ----------------------------------------------------------------------------------
  const handlePress = useCallback(() => {
    if (!interactive) return;
    onInteract?.();
    void AccessibilityInfo.announceForAccessibility('Ember smiles');
    markBusy(1500);

    const now = Date.now();
    tapTimes.current = [...tapTimes.current.filter(t => now - t < 3000), now];
    const excited =
      tapTimes.current.length >= 5 && now - lastExcited.current > 4000;
    if (excited) {
      lastExcited.current = now;
      tapTimes.current = [];
      showExpression('wow', 1500);
      if (motionOk) {
        doSpin(2);
        doHop(0.18);
        doBurst(1.5);
        doRuneSpin(360);
      }
      return;
    }

    const kind = TAP_REACTIONS[tapIndex.current % TAP_REACTIONS.length];
    tapIndex.current += 1;
    if (kind === 'wink') {
      if (motionOk) doWink();
      else showExpression('wink', 1000);
    } else {
      showExpression('happy', 1200);
    }
    if (!motionOk) return;
    if (kind === 'happy') {
      doHop(0.1);
      doBurst(1);
    } else if (kind === 'spin') {
      doSpin(1);
      doBurst(1);
    } else if (kind === 'tick') {
      doSway();
      doRingGlow();
      doRuneSpin(180);
    } else {
      doHop(0.06);
    }
  }, [
    interactive,
    onInteract,
    markBusy,
    showExpression,
    motionOk,
    doSpin,
    doHop,
    doBurst,
    doWink,
    doSway,
    doRingGlow,
    doRuneSpin,
  ]);

  const hideBubble = useCallback(() => {
    if (motionOk) {
      play(to(bubbleOpacity, 0, 260), () => setBubble(null));
    } else {
      bubbleOpacity.setValue(0);
      setBubble(null);
    }
  }, [bubbleOpacity, motionOk, play, to]);

  const announceTimeLeft = useCallback(() => {
    const label = timeLeftLabel(progress);
    void AccessibilityInfo.announceForAccessibility(label);
    return label;
  }, [progress]);

  const handleLongPress = useCallback(() => {
    if (!interactive) return;
    markBusy(3200);
    const label = announceTimeLeft();
    showExpression('wow', 1700);
    if (motionOk) {
      doRingGlow();
      doRewind();
    }
    if (onLongPress) {
      onLongPress(label);
      return;
    }
    setBubble(label);
    bubbleOpacity.setValue(motionOk ? 0 : 1);
    if (motionOk) play(to(bubbleOpacity, 1, 200));
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => {
      if (mounted.current) hideBubble();
    }, 2600);
  }, [
    interactive,
    markBusy,
    announceTimeLeft,
    showExpression,
    motionOk,
    doRingGlow,
    doRewind,
    onLongPress,
    bubbleOpacity,
    play,
    to,
    hideBubble,
  ]);

  const follow = useCallback(
    (x: number, y: number) => {
      const c = center.current;
      if (!c) return;
      const reach = size * 0.9;
      lookX.setValue(clamp((x - c.x) / reach, -1, 1));
      lookY.setValue(clamp((y - c.y) / reach, -1, 1));
    },
    [lookX, lookY, size],
  );

  const handleTouchStart = useCallback(
    (e: GestureResponderEvent) => {
      if (!interactive || !motionOk) return;
      touching.current = true;
      const { pageX, pageY } = e.nativeEvent;
      lastTouch.current = { x: pageX, y: pageY };
      stageRef.current?.measureInWindow((x, y, w, h) => {
        center.current = { x: x + w / 2, y: y + h / 2 };
        const t = lastTouch.current;
        if (t && touching.current) follow(t.x, t.y);
      });
    },
    [interactive, motionOk, follow],
  );

  const handleTouchMove = useCallback(
    (e: GestureResponderEvent) => {
      if (!touching.current) return;
      const { pageX, pageY } = e.nativeEvent;
      lastTouch.current = { x: pageX, y: pageY };
      follow(pageX, pageY);
    },
    [follow],
  );

  const handleTouchEnd = useCallback(() => {
    if (!touching.current) return;
    touching.current = false;
    play(Animated.parallel([to(lookX, 0, 320), to(lookY, 0, 320)]));
  }, [lookX, lookY, play, to]);

  const handleAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      if (event.nativeEvent.actionName === 'timeLeft') announceTimeLeft();
    },
    [announceTimeLeft],
  );

  // --- Derived animated styles ----------------------------------------------------------------
  const frames = useMemo(
    () => ({
      float: waveKeyframes(3, size * 0.055, -size * 0.015),
      breathe: waveKeyframes(2, 0.03, 1.02),
      glow: waveKeyframes(4, 0.275, 0.725),
      head: waveKeyframes(6, 0.3, 0.7),
      headScale: waveKeyframes(6, 0.16, 1),
    }),
    [size],
  );

  const floatY = life.interpolate(frames.float);
  const breathe = life.interpolate(frames.breathe);
  const eyeGlow = life.interpolate(frames.glow);
  const headOpacity = life.interpolate(frames.head);
  const headScale = life.interpolate(frames.headScale);

  // The runes repeat every 90 degrees and the dashes every 10, so a quarter turn per loop is seamless.
  const runeTurn = life.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });
  const dashTurn = life.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-90deg'],
  });
  const boostTurn = runeBoost.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });
  const boostTurnBack = runeBoost.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '-360deg'],
    extrapolate: 'extend',
  });
  const headTurn = headDeg.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });
  // Squashing a curved lid flat leaves an ugly bar, so the lid fades out as it opens and the thin
  // outline of the eye is all that remains.
  const lidScale = lid.interpolate({
    inputRange: [0, 1],
    outputRange: [LID_OPEN, 1],
  });
  const lidFade = lid.interpolate({
    inputRange: [0, 0.1, 0.25],
    outputRange: [0, 0.7, 1],
    extrapolate: 'clamp',
  });
  const swayDeg = sway.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-7deg', '7deg'],
  });
  const spinDeg = spin.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0deg', '360deg', '720deg'],
  });
  const ringScale = ringGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const auraBoost = ringGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const pupilTravel = 1.9 * u;
  const pupilX = lookX.interpolate({
    inputRange: [-1, 1],
    outputRange: [-pupilTravel, pupilTravel],
  });
  const pupilY = lookY.interpolate({
    inputRange: [-1, 1],
    outputRange: [-pupilTravel * 0.8, pupilTravel * 0.8],
  });
  const eyesShift = lookX.interpolate({
    inputRange: [-1, 1],
    outputRange: [-1.6 * u, 1.6 * u],
  });

  const sparks = useMemo(() => {
    if (!shouldAnimate) return [];
    const count = vitals.sparkCount;
    return Array.from({ length: count }, (_, i) => {
      const phase = i / count + (i % 2) * 0.05;
      const startX = ((i % MAX_SPARKS) / (MAX_SPARKS - 1) - 0.5) * size * 0.7;
      const drift = ((i % 3) - 1) * size * 0.18;
      const fall = vitals.sparksFall;
      return {
        key: i,
        px: Math.max(2, (2 + (i % 3)) * (size / 56)),
        tint: i % 2 === 0 ? 'hi' : 'white',
        x: phaseKeyframes(phase, [0, 1], [startX, startX + drift]),
        y: phaseKeyframes(
          phase,
          [0, 1],
          fall ? [-size * 0.38, size * 0.62] : [size * 0.15, -size * 0.6],
        ),
        opacity: phaseKeyframes(
          phase,
          [0, 0.15, 0.7, 1],
          [0, fall ? 0.7 : 0.9, 0.4, 0],
        ),
        scale: phaseKeyframes(phase, [0, 0.3, 1], [0.4, 1, 0.2]),
      };
    });
  }, [shouldAnimate, vitals.sparkCount, vitals.sparksFall, size]);

  const burstSpecs = useMemo(
    () =>
      Array.from({ length: BURST_COUNT }, (_, i) => {
        const angle = (i / BURST_COUNT) * Math.PI * 2 + (i % 2) * 0.2;
        return {
          key: i,
          dx: Math.cos(angle),
          dy: Math.sin(angle),
          px: Math.max(2.5, (2.5 + (i % 3)) * (size / 56)),
        };
      }),
    [size],
  );

  // --- Static drawings ------------------------------------------------------------------------
  const elapsed = clamp(progress, 0, 1);
  const auraLevel = 0.55 + 0.45 * left;
  const headSize = Math.max(4, size * 0.1);

  const runeRing = useMemo(
    () => (
      <Svg width={dialBox} height={dialBox} viewBox={`0 0 ${DIAL} ${DIAL}`}>
        <Circle
          cx={50}
          cy={50}
          r={RUNE_R}
          stroke={BRASS.mid}
          strokeOpacity={0.35}
          strokeWidth={0.7}
          fill="none"
        />
        {Array.from({ length: RUNE_SLOTS }, (_, k) => (
          <G key={k} rotation={k * (360 / RUNE_SLOTS)} originX={50} originY={50}>
            <Path d={runePath(k % 3)} fill={BRASS.mid} fillOpacity={0.95} />
          </G>
        ))}
      </Svg>
    ),
    [dialBox],
  );

  const dashRing = useMemo(
    () => (
      <Svg width={dialBox} height={dialBox} viewBox={`0 0 ${DIAL} ${DIAL}`}>
        <Circle
          cx={50}
          cy={50}
          r={DASH_R}
          stroke={BRASS.mid}
          strokeOpacity={0.75}
          strokeWidth={1.1}
          strokeDasharray={`${DASH_PERIOD * 0.62} ${DASH_PERIOD * 0.38}`}
          fill="none"
        />
      </Svg>
    ),
    [dialBox],
  );

  const eyeW = 9 * u;
  const eyeH = 10.5 * u;
  const eyeTop = 28 * u - eyeH / 2;
  const eyeLeftX = (32 - 12.5) * u - eyeW / 2;
  const eyeRightX = (32 + 12.5) * u - eyeW / 2;
  const pupil = 5 * u;
  const lidSquint = expression === 'sleepy' ? 0.7 : 1;

  const renderEye = (x: number, blink: Animated.Value, key: string) => (
    <Animated.View
      key={key}
      style={[
        styles.eyeWrap,
        {
          left: x,
          top: eyeTop,
          width: eyeW,
          height: eyeH,
          transform: [{ scaleY: lidSquint }, { scaleY: blink }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.eyeHalo,
          {
            width: eyeW * 1.9,
            height: eyeW * 1.9,
            borderRadius: eyeW,
            left: -eyeW * 0.45,
            top: (eyeH - eyeW * 1.9) / 2,
            backgroundColor: colors.hi,
            opacity: eyeGlow,
          },
        ]}
      />
      <View
        style={[
          styles.eye,
          {
            width: eyeW,
            height: eyeH,
            borderRadius: eyeW / 2,
            shadowColor: colors.hi,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.pupil,
          {
            width: pupil,
            height: pupil,
            borderRadius: pupil / 2,
            left: (eyeW - pupil) / 2,
            top: (eyeH - pupil) / 2,
            transform: [{ translateX: pupilX }, { translateY: pupilY }],
          },
        ]}
      />
    </Animated.View>
  );

  const happyFace =
    expression === 'happy' || expression === 'wink' || expression === 'wow';

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={420}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      disabled={!interactive}
      accessibilityRole={interactive ? 'button' : undefined}
      accessibilityLabel={`Ember companion, ${mood} mood. ${timeLeftLabel(
        progress,
      )}${interactive ? '. Tap to say hello' : ''}`}
      accessibilityActions={
        interactive ? [{ name: 'timeLeft', label: 'Hear time left today' }] : []
      }
      onAccessibilityAction={handleAccessibilityAction}
      hitSlop={8}
    >
      <Animated.View
        ref={stageRef}
        style={[
          styles.stage,
          { width: stage, height: stage },
          {
            transform: [
              { translateY: hop },
              { scale: tap },
              { rotate: swayDeg },
              { rotate: spinDeg },
            ],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.layer,
            { width: stage, height: stage },
            {
              transform: [{ translateY: floatY }, { scale: breathe }],
            },
          ]}
        >
          {/* Soft glow. Brighter early in the day, dimmer as it burns down. */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.layer,
              {
                width: size * 1.5,
                height: size * 1.5,
                opacity: auraBoost,
              },
            ]}
          >
            <Svg width={size * 1.5} height={size * 1.5} viewBox="0 0 100 100">
              <Defs>
                <RadialGradient id={`${uid}-aura`} cx="50%" cy="50%" r="50%">
                  <Stop
                    offset="0"
                    stopColor={colors.mid}
                    stopOpacity={0.55 * auraLevel}
                  />
                  <Stop
                    offset="0.5"
                    stopColor={colors.mid}
                    stopOpacity={0.2 * auraLevel}
                  />
                  <Stop offset="1" stopColor={colors.mid} stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Circle cx={50} cy={50} r={50} fill={`url(#${uid}-aura)`} />
            </Svg>
          </Animated.View>

          {sparks.map(spark => (
            <Animated.View
              key={`spark-${spark.key}`}
              pointerEvents="none"
              style={[
                styles.spark,
                {
                  width: spark.px,
                  height: spark.px,
                  borderRadius: spark.px,
                  backgroundColor:
                    spark.tint === 'hi' ? colors.hi : BRASS.hi,
                  opacity: sparkClock.interpolate(spark.opacity),
                  transform: [
                    { translateX: sparkClock.interpolate(spark.x) },
                    { translateY: sparkClock.interpolate(spark.y) },
                    { scale: sparkClock.interpolate(spark.scale) },
                  ],
                },
              ]}
            />
          ))}

          {/* Rune ring, turning one way. */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.layer,
              {
                width: dialBox,
                height: dialBox,
                transform: [{ rotate: runeTurn }, { rotate: boostTurn }],
              },
            ]}
          >
            {runeRing}
          </Animated.View>

          {/* Dash ring, turning the other way. */}
          {detailed ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.layer,
                {
                  width: dialBox,
                  height: dialBox,
                  transform: [{ rotate: dashTurn }, { rotate: boostTurnBack }],
                },
              ]}
            >
              {dashRing}
            </Animated.View>
          ) : null}

          {/* The day ring: violet is gone, bright is still ahead, the white dot is now. */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.layer,
              {
                width: dialBox,
                height: dialBox,
                transform: [{ scale: ringScale }],
              },
            ]}
          >
            <Svg width={dialBox} height={dialBox} viewBox={`0 0 ${DIAL} ${DIAL}`}>
              <Circle
                cx={50}
                cy={50}
                r={DAY_R}
                stroke="#FFFFFF"
                strokeOpacity={0.1}
                strokeWidth={3.2}
                fill="none"
              />
              {elapsed > 0.004 ? (
                <Circle
                  cx={50}
                  cy={50}
                  r={DAY_R}
                  stroke={PASSED}
                  strokeOpacity={0.6}
                  strokeWidth={3.2}
                  strokeLinecap="round"
                  strokeDasharray={`${DAY_LEN * elapsed} ${DAY_LEN}`}
                  rotation={-90}
                  originX={50}
                  originY={50}
                  fill="none"
                />
              ) : null}
              {left > 0.004 ? (
                <Circle
                  cx={50}
                  cy={50}
                  r={DAY_R}
                  stroke={colors.hi}
                  strokeOpacity={0.95}
                  strokeWidth={3.6}
                  strokeLinecap="round"
                  strokeDasharray={`${DAY_LEN * left} ${DAY_LEN}`}
                  strokeDashoffset={-DAY_LEN * elapsed}
                  rotation={-90}
                  originX={50}
                  originY={50}
                  fill="none"
                />
              ) : null}
              {[0, 90, 180, 270].map(angle => (
                <G key={angle} rotation={angle} originX={50} originY={50}>
                  <Line
                    x1={50}
                    y1={0.6}
                    x2={50}
                    y2={4.2}
                    stroke="#FFFFFF"
                    strokeOpacity={0.55}
                    strokeWidth={1.2}
                    strokeLinecap="round"
                  />
                </G>
              ))}
            </Svg>
            <Animated.View
              style={[
                styles.layer,
                {
                  width: dialBox,
                  height: dialBox,
                  transform: [{ rotate: headTurn }],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.head,
                  {
                    top: ((50 - DAY_R) / DIAL) * dialBox - headSize / 2,
                    left: dialBox / 2 - headSize / 2,
                    width: headSize,
                    height: headSize,
                    borderRadius: headSize / 2,
                    shadowColor: colors.hi,
                    opacity: headOpacity,
                    transform: [{ scale: headScale }],
                  },
                ]}
              />
            </Animated.View>
          </Animated.View>

          <View
            style={{
              width: size,
              height: size,
              transform: [{ scale: vitals.flame }],
            }}
          >
            <Svg width={size} height={size} viewBox="0 0 64 64">
              <Defs>
                <RadialGradient id={`${uid}-body`} cx="35%" cy="28%" r="72%">
                  <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
                  <Stop offset="0.32" stopColor={colors.hi} stopOpacity="1" />
                  <Stop offset="0.72" stopColor={colors.mid} stopOpacity="1" />
                  <Stop offset="1" stopColor={colors.deep} stopOpacity="1" />
                </RadialGradient>
              </Defs>
              <Circle cx={32} cy={34} r={24} fill={colors.glow} opacity={0.5} />
              <Circle cx={32} cy={34} r={21} fill={`url(#${uid}-body)`} />
              {/* Cut-gem facets. */}
              {[0, 60, 120, 180, 240, 300].map(angle => (
                <G key={angle} rotation={angle} originX={32} originY={34}>
                  <Line
                    x1={32}
                    y1={22}
                    x2={32}
                    y2={13.5}
                    stroke="#FFFFFF"
                    strokeOpacity={0.13}
                    strokeWidth={0.9}
                  />
                </G>
              ))}
              <Path
                d="M32 22 L42.4 28 L42.4 40 L32 46 L21.6 40 L21.6 28 Z"
                stroke="#FFFFFF"
                strokeOpacity={0.14}
                strokeWidth={0.9}
                fill="none"
              />
              <Ellipse
                cx={24}
                cy={24}
                rx={8}
                ry={5}
                fill="#FFFFFF"
                fillOpacity={0.38}
              />
              {happyFace ? (
                <>
                  <Circle cx={19} cy={38} r={3.2} fill="#FF8FA3" fillOpacity={0.4} />
                  <Circle cx={45} cy={38} r={3.2} fill="#FF8FA3" fillOpacity={0.4} />
                </>
              ) : null}
              {expression === 'yawn' ? (
                <Ellipse
                  cx={32}
                  cy={43}
                  rx={4.2}
                  ry={5.2}
                  fill="#7C2D12"
                  fillOpacity={0.7}
                  stroke="#FFFFFF"
                  strokeOpacity={0.85}
                  strokeWidth={1.6}
                />
              ) : expression === 'wow' ? (
                <Ellipse
                  cx={32}
                  cy={42.5}
                  rx={2.8}
                  ry={3.4}
                  fill="#7C2D12"
                  fillOpacity={0.7}
                  stroke="#FFFFFF"
                  strokeOpacity={0.85}
                  strokeWidth={1.6}
                />
              ) : (
                <Path
                  d={
                    expression === 'happy' || expression === 'wink'
                      ? 'M22 41c4 7 16 7 20 0'
                      : expression === 'sleepy'
                        ? 'M27.5 42h9'
                        : 'M24 40c3 4 13 4 16 0'
                  }
                  stroke="#FFFFFF"
                  strokeOpacity={0.9}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  fill="none"
                />
              )}
            </Svg>

            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                { transform: [{ translateX: eyesShift }] },
              ]}
            >
              {renderEye(eyeLeftX, blinkL, 'eye-l')}
              {renderEye(eyeRightX, blinkR, 'eye-r')}
            </Animated.View>

            {/* The cradle: an eye-shaped brass frame. The lids close over the gem when Ember sleeps. */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.lid,
                {
                  top: 10 * u,
                  width: size,
                  height: 24 * u,
                  opacity: lidFade,
                  transformOrigin: 'center top',
                  transform: [{ scaleY: lidScale }],
                },
              ]}
            >
              <Svg width={size} height={24 * u} viewBox="0 10 64 24">
                <Defs>
                  <LinearGradient id={`${uid}-brass`} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={BRASS.hi} />
                    <Stop offset="0.55" stopColor={BRASS.mid} />
                    <Stop offset="1" stopColor={BRASS.deep} />
                  </LinearGradient>
                </Defs>
                <Path
                  d="M2 34 Q32 -14 62 34 Z"
                  fill={`url(#${uid}-brass)`}
                  stroke={BRASS.hi}
                  strokeWidth={1.4}
                  strokeLinejoin="round"
                />
              </Svg>
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.lid,
                {
                  top: 34 * u,
                  width: size,
                  height: 24 * u,
                  opacity: lidFade,
                  transformOrigin: 'center bottom',
                  transform: [{ scaleY: lidScale }],
                },
              ]}
            >
              <Svg width={size} height={24 * u} viewBox="0 34 64 24">
                <Defs>
                  <LinearGradient id={`${uid}-brass2`} x1="0" y1="1" x2="0" y2="0">
                    <Stop offset="0" stopColor={BRASS.hi} />
                    <Stop offset="0.55" stopColor={BRASS.mid} />
                    <Stop offset="1" stopColor={BRASS.deep} />
                  </LinearGradient>
                </Defs>
                <Path
                  d="M2 34 Q32 82 62 34 Z"
                  fill={`url(#${uid}-brass2)`}
                  stroke={BRASS.hi}
                  strokeWidth={1.4}
                  strokeLinejoin="round"
                />
              </Svg>
            </Animated.View>
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <Svg width={size} height={size} viewBox="0 0 64 64">
                <Path
                  d="M2 34 Q32 -14 62 34 Q32 82 2 34 Z"
                  stroke={BRASS.mid}
                  strokeOpacity={0.95}
                  strokeWidth={1.4}
                  strokeLinejoin="round"
                  fill="none"
                />
                <Circle cx={2} cy={34} r={1.8} fill={BRASS.mid} />
                <Circle cx={62} cy={34} r={1.8} fill={BRASS.mid} />
              </Svg>
            </View>
          </View>

          {sleepy && shouldAnimate
            ? [0, 0.5].map(phase => {
                const z = (k: number[], v: number[]) =>
                  sparkClock.interpolate(phaseKeyframes(phase, k, v));
                return (
                  <Animated.Text
                    key={`z-${phase}`}
                    pointerEvents="none"
                    style={[
                      styles.zzz,
                      {
                        color: colors.hi,
                        fontSize: Math.max(9, size * 0.2),
                        opacity: z([0, 0.2, 0.8, 1], [0, 0.9, 0.8, 0]),
                        transform: [
                          { translateX: z([0, 1], [size * 0.2, size * 0.42]) },
                          { translateY: z([0, 1], [-size * 0.2, -size * 0.6]) },
                          { scale: z([0, 1], [0.6, 1.1]) },
                        ],
                      },
                    ]}
                  >
                    z
                  </Animated.Text>
                );
              })
            : null}
        </Animated.View>

        {/* Spark circle: a ring of sparks that swirls out like a spell, or pulls in when time rewinds. */}
        {bursting ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.layer,
              {
                width: stage,
                height: stage,
                transform: [
                  {
                    rotate: burst.interpolate({
                      inputRange: [0, 1],
                      outputRange: burstInward
                        ? ['0deg', '-140deg']
                        : ['0deg', '110deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            {burstSpecs.map(spec => {
              const reach = size * 0.78 * burstPower;
              return (
                <Animated.View
                  key={`burst-${spec.key}`}
                  pointerEvents="none"
                  style={[
                    styles.spark,
                    {
                      width: spec.px,
                      height: spec.px,
                      borderRadius: spec.px,
                      backgroundColor:
                        spec.key % 3 === 0
                          ? '#FFFFFF'
                          : spec.key % 3 === 1
                            ? BRASS.hi
                            : colors.mid,
                      opacity: burst.interpolate({
                        inputRange: [0, 0.15, 1],
                        outputRange: burstInward ? [0, 0.9, 0] : [0, 1, 0],
                      }),
                      transform: [
                        {
                          translateX: burst.interpolate({
                            inputRange: [0, 1],
                            outputRange: burstInward
                              ? [spec.dx * reach, 0]
                              : [0, spec.dx * reach],
                          }),
                        },
                        {
                          translateY: burst.interpolate({
                            inputRange: [0, 1],
                            outputRange: burstInward
                              ? [spec.dy * reach, 0]
                              : [0, spec.dy * reach],
                          }),
                        },
                        {
                          scale: burst.interpolate({
                            inputRange: [0, 0.25, 1],
                            outputRange: [0.5, 1.1, 0.2],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              );
            })}
          </Animated.View>
        ) : null}
      </Animated.View>

      {bubble ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.bubbleRow,
            { opacity: bubbleOpacity, marginBottom: -size * 0.12 },
          ]}
        >
          <View style={[styles.bubble, { borderColor: BRASS.mid }]}>
            <RNText
              numberOfLines={1}
              style={[
                styles.bubbleText,
                { fontFamily: getFontFamilyForWeight(Weight.medium) },
              ]}
            >
              {bubble}
            </RNText>
          </View>
        </Animated.View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  layer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lid: {
    position: 'absolute',
    left: 0,
  },
  spark: {
    position: 'absolute',
  },
  head: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: BRASS.mid,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  eyeWrap: {
    position: 'absolute',
  },
  eyeHalo: {
    position: 'absolute',
  },
  eye: {
    position: 'absolute',
    backgroundColor: '#FFF8E7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 5,
    elevation: 3,
  },
  pupil: {
    position: 'absolute',
    backgroundColor: '#1A1208',
  },
  zzz: {
    position: 'absolute',
    fontWeight: '700',
  },
  bubbleRow: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    width: 240,
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(20, 20, 22, 0.94)',
  },
  bubbleText: {
    fontSize: 12,
    color: '#EDEDED',
  },
});
