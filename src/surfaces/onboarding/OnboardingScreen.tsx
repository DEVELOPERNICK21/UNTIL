/**
 * Onboarding — animated welcome + interactive Day demo + widget preview.
 */

import React, {
  useState,
  useCallback,
  createContext,
  useContext,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Vibration,
  Pressable,
  Animated,
  Easing,
  PanResponder,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Text, ScreenGradient, PeriodGlyph, Ember } from '../../ui';
import {
  useTheme,
  Spacing,
  Typography,
  Radius,
  Weight,
  getFontFamilyForWeight,
  Shadows,
} from '../../theme';
import { useAnalytics } from '../../hooks';

type StepConfig = {
  stepName: string;
  cta: string;
  ctaGoesToNext: boolean;
};

const STEPS: StepConfig[] = [
  {
    stepName: 'welcome',
    cta: 'Show me how it works',
    ctaGoesToNext: true,
  },
  {
    stepName: 'live_day_demo',
    cta: 'Next',
    ctaGoesToNext: true,
  },
  {
    stepName: 'widgets_start',
    cta: 'Get started',
    ctaGoesToNext: false,
  },
];

const PASSED = '#EF4444';
const LEFT = '#22C55E';

const FEATURES = [
  {
    id: 'day',
    label: 'Day %',
    glyph: 'day' as const,
    blurb: 'Live ring of today’s passed and left time.',
  },
  {
    id: 'widgets',
    label: 'Widgets',
    glyph: 'month' as const,
    blurb: 'Home screen glances — no app open needed.',
  },
  {
    id: 'life',
    label: 'Life view',
    glyph: 'life' as const,
    blurb: 'Your life progress, once you set a birth date.',
  },
];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const OnboardingCompleteContext = createContext<
  ((params?: {
    exit_type: 'skipped' | 'completed';
    step: number;
    step_name: string;
  }) => void) | null
>(null);

export function useOnboardingComplete() {
  const cb = useContext(OnboardingCompleteContext);
  if (!cb) throw new Error('Must be used inside AuthNavigator');
  return cb;
}

function useLiveDayClock(enabled: boolean) {
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

function useEnter(active: boolean, delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(22)).current;

  useEffect(() => {
    if (!active) {
      opacity.setValue(0);
      y.setValue(22);
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
  }, [active, delay, opacity, y]);

  return { opacity, transform: [{ translateY: y }] };
}

function BrandHeader({ onSkip }: { onSkip: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.brandHeader}>
      <Text
        variant="sectionTitle"
        style={[styles.brandTitle, { color: theme.textPrimary }]}
      >
        UNTIL
      </Text>
      <TouchableOpacity onPress={onSkip} hitSlop={12} accessibilityRole="button">
        <Text variant="body" style={{ color: theme.textSecondary }}>
          Skip
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function WelcomeSlide({ width, active }: { width: number; active: boolean }) {
  const theme = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const glow = useRef(new Animated.Value(0)).current;
  const brandScale = useRef(new Animated.Value(0.92)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const headline = useEnter(active, 120);
  const body = useEnter(active, 220);
  const chips = useEnter(active, 340);

  useEffect(() => {
    if (!active) return;
    Animated.parallel([
      Animated.spring(brandScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(brandOpacity, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
      }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, brandScale, brandOpacity, glow]);

  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.welcomeHero}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.welcomeGlow,
            {
              backgroundColor: theme.percent,
              opacity: glow.interpolate({
                inputRange: [0, 1],
                outputRange: [0.1, 0.22],
              }),
              transform: [
                {
                  scale: glow.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.92, 1.12],
                  }),
                },
              ],
            },
          ]}
        />

        <Animated.View
          style={{ opacity: brandOpacity, transform: [{ scale: brandScale }] }}
        >
          <View style={styles.welcomeEmberRow}>
            <Ember progress={0.32} size={64} />
          </View>
          <Text
            variant="micro"
            style={[styles.eyebrow, { color: theme.percent }]}
          >
            WELCOME
          </Text>
          <Text
            variant="display"
            style={[styles.welcomeBrand, { color: theme.textPrimary }]}
          >
            UNTIL
          </Text>
        </Animated.View>

        <Animated.View style={headline}>
          <Text
            variant="headline"
            style={[styles.welcomeHeadline, { color: theme.textPrimary }]}
          >
            See how much of your day is left.
          </Text>
        </Animated.View>

        <Animated.View style={body}>
          <Text
            variant="body"
            style={[styles.welcomeBody, { color: theme.textSecondary }]}
          >
            Not to rush you — to notice what remains. Day, month, year, and life,
            on screen and as home widgets.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.featureRow, chips]}>
          {FEATURES.map((f, i) => {
            const on = selected === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => {
                  Vibration.vibrate(8);
                  setSelected(on ? null : f.id);
                }}
                style={[
                  styles.featureChip,
                  {
                    borderColor: on ? theme.percent : theme.glassBorder,
                    backgroundColor: on
                      ? 'rgba(232, 124, 32, 0.14)'
                      : theme.glassBg,
                    transform: [{ scale: on ? 1.04 : 1 }],
                  },
                  Shadows.card,
                ]}
              >
                <PeriodGlyph
                  kind={f.glyph}
                  size={28}
                  progress={0.35 + i * 0.18}
                  pressed={on}
                  animated={active}
                />
                <Text
                  variant="caption"
                  style={{
                    color: on ? theme.percent : theme.textPrimary,
                    marginTop: 6,
                    fontFamily: getFontFamilyForWeight(Weight.medium),
                  }}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </Animated.View>

        {selected ? (
          <Animated.View
            style={[
              styles.featureBlurb,
              {
                borderColor: theme.glassBorder,
                backgroundColor: theme.glassBg,
              },
            ]}
          >
            <Text variant="body" style={{ color: theme.textSecondary }}>
              {FEATURES.find(f => f.id === selected)?.blurb}
            </Text>
          </Animated.View>
        ) : (
          <Text
            variant="caption"
            style={[styles.tapCue, { color: theme.textMuted }]}
          >
            Tap a chip to explore
          </Text>
        )}
      </View>
    </View>
  );
}

function LiveDayRing({
  progress,
  size = 200,
  interactive,
}: {
  progress: number;
  size?: number;
  interactive: boolean;
}) {
  const theme = useTheme();
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const live = Math.min(1, Math.max(0, progress));

  const [scrubbing, setScrubbing] = useState(false);
  const [display, setDisplay] = useState(live);
  const ring = useRef(new Animated.Value(live)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const rotateHint = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (scrubbing) return;
    setDisplay(live);
    Animated.timing(ring, {
      toValue: live,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [live, scrubbing, ring]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.03,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    const spin = Animated.loop(
      Animated.timing(rotateHint, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    spin.start();
    return () => {
      loop.stop();
      spin.stop();
    };
  }, [pulse, rotateHint]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => interactive,
        onMoveShouldSetPanResponder: () => interactive,
        onPanResponderGrant: () => {
          setScrubbing(true);
          Vibration.vibrate(6);
        },
        onPanResponderMove: (_, g) => {
          // Horizontal drag maps to 0–1 progress (playable preview)
          const delta = g.dx / (size * 0.9);
          const next = Math.min(1, Math.max(0, live + delta));
          setDisplay(next);
          ring.setValue(next);
        },
        onPanResponderRelease: () => {
          setScrubbing(false);
          Vibration.vibrate(8);
          Animated.spring(ring, {
            toValue: live,
            friction: 7,
            tension: 60,
            useNativeDriver: false,
          }).start();
          setDisplay(live);
        },
        onPanResponderTerminate: () => {
          setScrubbing(false);
          setDisplay(live);
          ring.setValue(live);
        },
      }),
    [interactive, live, ring, size],
  );

  const dashOffset = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });
  const percent = Math.round(display * 100);
  const orbitRotate = rotateHint.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      {...pan.panHandlers}
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale: pulse }],
      }}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={LEFT}
          strokeWidth={stroke}
          fill="none"
          strokeOpacity={0.9}
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={PASSED}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { transform: [{ rotate: orbitRotate }] },
        ]}
      >
        <View
          style={[
            styles.orbitTick,
            {
              backgroundColor: theme.percent,
              top: stroke / 2,
              left: size / 2 - 4,
            },
          ]}
        />
      </Animated.View>

      <Text
        variant="micro"
        style={{ color: theme.textSecondary, letterSpacing: 2 }}
      >
        {scrubbing ? 'PREVIEW' : 'TODAY'}
      </Text>
      <Text
        variant="timer"
        style={[styles.livePercent, { color: theme.percent }]}
      >
        {percent}%
      </Text>
      <Text variant="caption" style={{ color: theme.textSecondary }}>
        {scrubbing ? 'Release to return live' : 'of the day passed'}
      </Text>
    </Animated.View>
  );
}

function LiveDayDemoSlide({
  width,
  active,
}: {
  width: number;
  active: boolean;
}) {
  const theme = useTheme();
  const clock = useLiveDayClock(active);
  const [highlightWidgets, setHighlightWidgets] = useState(false);
  const title = useEnter(active, 40);
  const sub = useEnter(active, 120);
  const ringEnter = useEnter(active, 180);
  const metrics = useEnter(active, 280);
  const hint = useEnter(active, 360);
  const hintPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!highlightWidgets) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(hintPulse, {
          toValue: 1.03,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(hintPulse, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [highlightWidgets, hintPulse]);

  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.demoBody}>
        <Animated.View style={title}>
          <Text
            variant="micro"
            style={[styles.eyebrow, { color: theme.percent }]}
          >
            LIVE DEMO
          </Text>
          <Text
            variant="display"
            style={[styles.slideTitle, { color: theme.textPrimary }]}
          >
            This is today, updating live.
          </Text>
        </Animated.View>

        <Animated.View style={sub}>
          <Text
            variant="body"
            style={[styles.slideSubtitle, { color: theme.textSecondary }]}
          >
            Drag the ring left or right to preview — it snaps back to real time.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.ringWrap, ringEnter]}>
          <LiveDayRing progress={clock.progress} interactive={active} />
        </Animated.View>

        <Animated.View style={[styles.metricsRow, metrics]}>
          <View style={styles.metric}>
            <View style={[styles.metricDot, { backgroundColor: PASSED }]} />
            <Text variant="caption" style={{ color: theme.textSecondary }}>
              Passed
            </Text>
            <Text variant="sectionTitle" style={{ color: theme.textPrimary }}>
              {clock.percentDone}%
            </Text>
          </View>
          <View style={styles.metric}>
            <View style={[styles.metricDot, { backgroundColor: LEFT }]} />
            <Text variant="caption" style={{ color: theme.textSecondary }}>
              Left
            </Text>
            <Text variant="sectionTitle" style={{ color: theme.textPrimary }}>
              {clock.remainingLabel}
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={[{ transform: [{ scale: hintPulse }] }, hint]}>
          <Pressable
            onPress={() => {
              Vibration.vibrate(8);
              setHighlightWidgets(v => !v);
            }}
            style={[
              styles.widgetHint,
              {
                borderColor: highlightWidgets ? theme.percent : theme.glassBorder,
                backgroundColor: highlightWidgets
                  ? 'rgba(232, 124, 32, 0.14)'
                  : theme.glassBg,
              },
            ]}
          >
            <Text
              variant="caption"
              style={{
                color: highlightWidgets ? theme.percent : theme.textSecondary,
                textAlign: 'center',
              }}
            >
              {highlightWidgets
                ? 'Yes — this same Day view can live on your home screen as a widget.'
                : 'Tap: Where does this go? → Home screen widgets'}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

function WidgetMock({
  title,
  value,
  accent,
  progress,
  selected,
  onPress,
  enterDelay,
  active,
}: {
  title: string;
  value: string;
  accent: string;
  progress: number;
  selected: boolean;
  onPress: () => void;
  enterDelay: number;
  active: boolean;
}) {
  const theme = useTheme();
  const enter = useEnter(active, enterDelay);
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 1600 + enterDelay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1600 + enterDelay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, bob, enterDelay]);

  return (
    <Animated.View
      style={[
        enter,
        {
          flex: 1,
          transform: [
            ...(enter.transform ?? []),
            {
              translateY: bob.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -4],
              }),
            },
            { scale: selected ? 1.04 : 1 },
          ],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        style={[
          styles.widgetCard,
          {
            backgroundColor: theme.glassBg,
            borderColor: selected ? accent : theme.glassBorder,
            ...Shadows.glass,
          },
        ]}
      >
        <Text
          variant="micro"
          style={{ color: theme.textSecondary, letterSpacing: 1 }}
        >
          {title}
        </Text>
        <Text
          variant="title"
          style={{
            color: accent,
            marginTop: 4,
            fontFamily: getFontFamilyForWeight(Weight.semibold),
          }}
        >
          {value}
        </Text>
        <View style={[styles.widgetBarTrack, { backgroundColor: PASSED }]}>
          <View
            style={[
              styles.widgetBarFill,
              {
                width: `${Math.round(progress * 100)}%`,
                backgroundColor: LEFT,
              },
            ]}
          />
        </View>
        {selected ? (
          <Text
            variant="micro"
            style={{ color: accent, marginTop: 8, textAlign: 'center' }}
          >
            Add from your home screen
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

function WidgetsSlide({ width, active }: { width: number; active: boolean }) {
  const theme = useTheme();
  const clock = useLiveDayClock(active);
  const [focus, setFocus] = useState<'DAY' | 'YEAR' | null>(null);
  const title = useEnter(active, 40);
  const sub = useEnter(active, 120);
  const phone = useEnter(active, 200);
  const phoneScale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    if (!active) {
      phoneScale.setValue(0.94);
      return;
    }
    Animated.spring(phoneScale, {
      toValue: 1,
      friction: 7,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [active, phoneScale]);

  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.demoBody}>
        <Animated.View style={title}>
          <Text
            variant="micro"
            style={[styles.eyebrow, { color: theme.percent }]}
          >
            ON YOUR HOME SCREEN
          </Text>
          <Text
            variant="display"
            style={[styles.slideTitle, { color: theme.textPrimary }]}
          >
            Glance. Stay aware.
          </Text>
        </Animated.View>

        <Animated.View style={sub}>
          <Text
            variant="body"
            style={[styles.slideSubtitle, { color: theme.textSecondary }]}
          >
            Tap a preview widget — then add the real ones from your home screen.
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            phone,
            {
              transform: [
                ...(phone.transform ?? []),
                { scale: phoneScale },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.phoneFrame,
              {
                borderColor: theme.glassBorder,
                backgroundColor: theme.backgroundAlt,
              },
            ]}
          >
            <View
              style={[styles.phoneNotch, { backgroundColor: theme.divider }]}
            />
            <View style={styles.widgetGrid}>
              <WidgetMock
                title="DAY"
                value={`${clock.percentDone}%`}
                accent={theme.percent}
                progress={clock.progress}
                selected={focus === 'DAY'}
                onPress={() => {
                  Vibration.vibrate(8);
                  setFocus(f => (f === 'DAY' ? null : 'DAY'));
                }}
                enterDelay={260}
                active={active}
              />
              <WidgetMock
                title="YEAR"
                value="53%"
                accent={LEFT}
                progress={0.53}
                selected={focus === 'YEAR'}
                onPress={() => {
                  Vibration.vibrate(8);
                  setFocus(f => (f === 'YEAR' ? null : 'YEAR'));
                }}
                enterDelay={360}
                active={active}
              />
            </View>
            <Text
              variant="micro"
              style={{
                color: theme.textSecondary,
                textAlign: 'center',
                marginTop: Spacing.md,
              }}
            >
              Home screen preview
            </Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

function OnboardingScreenInner() {
  const completeOnboarding = useOnboardingComplete();
  const { logEvent } = useAnalytics();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [step, setStep] = useState(0);
  const safeStep = Math.min(Math.max(0, step), STEPS.length - 1);
  const config = STEPS[safeStep];
  const isLast = safeStep === STEPS.length - 1;
  const ctaScale = useRef(new Animated.Value(1)).current;

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const index = Math.round(x / width);
      setStep(Math.min(Math.max(0, index), STEPS.length - 1));
    },
    [width],
  );

  useEffect(() => {
    logEvent('onboarding_step', {
      step: safeStep + 1,
      step_name: config.stepName,
    });
  }, [logEvent, safeStep, config.stepName]);

  const finishOnboarding = useCallback(
    (exitType: 'skipped' | 'completed') => {
      Vibration.vibrate(10);
      completeOnboarding({
        exit_type: exitType,
        step: safeStep + 1,
        step_name: config.stepName,
      });
    },
    [completeOnboarding, safeStep, config.stepName],
  );

  const handleSkip = useCallback(() => {
    finishOnboarding('skipped');
  }, [finishOnboarding]);

  const handleCta = useCallback(() => {
    Vibration.vibrate(10);
    Animated.sequence([
      Animated.timing(ctaScale, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(ctaScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
    if (config.ctaGoesToNext && !isLast) {
      flatListRef.current?.scrollToIndex({
        index: safeStep + 1,
        animated: true,
      });
    } else {
      finishOnboarding('completed');
    }
  }, [
    config.ctaGoesToNext,
    isLast,
    safeStep,
    finishOnboarding,
    ctaScale,
  ]);

  const renderSlide = useCallback(
    ({ index }: { item: StepConfig; index: number }) => {
      if (index === 0) {
        return <WelcomeSlide width={width} active={safeStep === 0} />;
      }
      if (index === 1) {
        return <LiveDayDemoSlide width={width} active={safeStep === 1} />;
      }
      return <WidgetsSlide width={width} active={safeStep === 2} />;
    },
    [width, safeStep],
  );

  const keyExtractor = useCallback((_: StepConfig, i: number) => String(i), []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenGradient>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <BrandHeader onSkip={handleSkip} />

          <View style={styles.pagerWrap}>
            <FlatList
              ref={flatListRef}
              data={STEPS}
              renderItem={renderSlide}
              keyExtractor={keyExtractor}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onScroll}
              onScrollToIndexFailed={info => {
                setTimeout(
                  () =>
                    flatListRef.current?.scrollToIndex({
                      index: info.index,
                      animated: false,
                    }),
                  100,
                );
              }}
              bounces={false}
              getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
            />
          </View>

          <View style={styles.dotsRow}>
            {STEPS.map((_, i) => {
              const active = i === safeStep;
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.dot,
                    active
                      ? [styles.dotActive, { backgroundColor: theme.percent }]
                      : [
                          styles.dotInactive,
                          { backgroundColor: theme.progressTrack },
                        ],
                  ]}
                />
              );
            })}
          </View>

          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
            ]}
          >
            <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
              <TouchableOpacity
                style={[styles.ctaFull, { backgroundColor: theme.percent }]}
                onPress={handleCta}
                activeOpacity={0.9}
                accessibilityRole="button"
              >
                <Text variant="sectionTitle" style={styles.ctaFullLabel}>
                  {config.cta}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </SafeAreaView>
      </ScreenGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  brandTitle: {
    letterSpacing: 2,
    fontFamily: getFontFamilyForWeight(Weight.semibold),
  },
  pagerWrap: { flex: 1 },
  slide: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  welcomeHero: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: Spacing.xl,
  },
  welcomeEmberRow: {
    marginBottom: Spacing.md,
  },
  welcomeGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: '10%',
    alignSelf: 'center',
  },
  eyebrow: {
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  welcomeBrand: {
    fontSize: Typography.large + 8,
    letterSpacing: 4,
    fontFamily: getFontFamilyForWeight(Weight.bold),
    marginBottom: Spacing.md,
  },
  welcomeHeadline: {
    marginBottom: Spacing.md,
    lineHeight: Typography.headline * 1.25,
  },
  welcomeBody: {
    lineHeight: Typography.body * 1.55,
    marginBottom: Spacing.lg,
    maxWidth: 340,
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  featureChip: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    minWidth: 96,
  },
  featureBlurb: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  tapCue: {
    marginTop: Spacing.md,
  },
  demoBody: {
    flex: 1,
    paddingTop: Spacing.sm,
  },
  slideTitle: {
    marginBottom: Spacing.sm,
    lineHeight: Typography.display * 1.2,
  },
  slideSubtitle: {
    lineHeight: Typography.body * 1.5,
    marginBottom: Spacing.md,
  },
  ringWrap: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  livePercent: {
    fontFamily: getFontFamilyForWeight(Weight.semibold),
    marginVertical: 2,
  },
  orbitTick: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  metric: {
    alignItems: 'center',
    gap: 4,
  },
  metricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  widgetHint: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  phoneFrame: {
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    paddingTop: Spacing.lg,
  },
  phoneNotch: {
    alignSelf: 'center',
    width: 64,
    height: 6,
    borderRadius: 3,
    marginBottom: Spacing.md,
  },
  widgetGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  widgetCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  widgetBarTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  widgetBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 28,
  },
  dotInactive: {
    width: 8,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  ctaFull: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    minHeight: 52,
  },
  ctaFullLabel: {
    fontFamily: getFontFamilyForWeight(Weight.semibold),
    color: '#FFFFFF',
  },
});

export function OnboardingScreen() {
  return <OnboardingScreenInner />;
}

export { OnboardingCompleteContext };
