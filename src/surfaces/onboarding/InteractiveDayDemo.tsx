/**
 * Interactive live day demo — scrubbable progress ring.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Vibration,
  Animated,
  Easing,
  PanResponder,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '../../ui';
import {
  useTheme,
  Spacing,
  Typography,
  Radius,
  Weight,
  getFontFamilyForWeight,
} from '../../theme';
import {
  DAY_LEFT,
  DAY_PASSED,
  useEnter,
  useLiveDayClock,
} from './onboardingMotion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
      ])
    );
    loop.start();
    const spin = Animated.loop(
      Animated.timing(rotateHint, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
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
    [interactive, live, ring, size]
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
          stroke={DAY_LEFT}
          strokeWidth={stroke}
          fill="none"
          strokeOpacity={0.9}
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={DAY_PASSED}
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
        style={[
          styles.livePercent,
          {
            color: theme.percent,
            fontFamily: getFontFamilyForWeight(Weight.semibold),
          },
        ]}
      >
        {percent}%
      </Text>
      <Text variant="caption" style={{ color: theme.textSecondary }}>
        {scrubbing ? 'Release to return live' : 'of the day passed'}
      </Text>
    </Animated.View>
  );
}

interface InteractiveDayDemoProps {
  active: boolean;
}

export function InteractiveDayDemo({ active }: InteractiveDayDemoProps) {
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
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [highlightWidgets, hintPulse]);

  return (
    <View style={styles.body}>
      <Animated.View style={title}>
        <Text variant="micro" style={[styles.eyebrow, { color: theme.percent }]}>
          LIVE DEMO
        </Text>
        <Text
          variant="display"
          style={[
            styles.slideTitle,
            {
              color: theme.textPrimary,
              fontFamily: getFontFamilyForWeight(Weight.bold),
            },
          ]}
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
          <View style={[styles.metricDot, { backgroundColor: DAY_PASSED }]} />
          <Text variant="caption" style={{ color: theme.textSecondary }}>
            Passed
          </Text>
          <Text variant="sectionTitle" style={{ color: theme.textPrimary }}>
            {clock.percentDone}%
          </Text>
        </View>
        <View style={styles.metric}>
          <View style={[styles.metricDot, { backgroundColor: DAY_LEFT }]} />
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
  );
}

const styles = StyleSheet.create({
  body: {
    flexGrow: 1,
    paddingTop: Spacing.sm,
  },
  eyebrow: {
    letterSpacing: 2,
    marginBottom: Spacing.sm,
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
});
