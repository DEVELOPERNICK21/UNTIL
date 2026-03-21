/**
 * Placeholder for monthly goals & daily tasks (V2).
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import Svg, { Line, Rect, Path } from 'react-native-svg';
import { Text, ScreenGradient } from '../../ui';
import {
  Spacing,
  Radius,
  Shadows,
  useTheme,
  FontFamily,
  Typography,
} from '../../theme';

const PEEK_HEIGHT = 168;

function ChecklistHero({
  pulse,
  accent,
  secondary,
}: {
  pulse: Animated.Value;
  accent: string;
  secondary: string;
}) {
  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0.12],
  });
  const innerPulse = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  return (
    <View style={styles.heroWrap}>
      <Animated.View
        style={[
          styles.pulseRing,
          {
            borderColor: accent,
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.iconCircle,
          {
            backgroundColor: `${accent}22`,
            borderColor: `${accent}55`,
            transform: [{ scale: innerPulse }],
          },
        ]}
      >
        <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
          <Rect
            x={5}
            y={3}
            width={14}
            height={18}
            rx={2}
            stroke={accent}
            strokeWidth={2}
            fill="none"
          />
          <Line
            x1={8}
            y1={8}
            x2={16}
            y2={8}
            stroke={secondary}
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={0.85}
          />
          <Line
            x1={8}
            y1={12}
            x2={16}
            y2={12}
            stroke={secondary}
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={0.85}
          />
          <Line
            x1={8}
            y1={16}
            x2={14}
            y2={16}
            stroke={secondary}
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={0.85}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

function TeaserRow({
  label,
  index,
  show,
  accent,
}: {
  label: string;
  index: number;
  show: Animated.Value;
  accent: string;
}) {
  const opacity = show.interpolate({
    inputRange: [0, 0.25 + index * 0.2, 1],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });
  const translateY = show.interpolate({
    inputRange: [0, 0.2 + index * 0.15, 1],
    outputRange: [10, 4, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[styles.teaserRow, { opacity, transform: [{ translateY }] }]}
    >
      <View style={[styles.teaserDot, { backgroundColor: accent }]} />
      <Text variant="body" color="secondary" style={styles.teaserLabel}>
        {label}
      </Text>
    </Animated.View>
  );
}

export function TasksComingSoonScreen() {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const screenEnter = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const peekProgress = useRef(new Animated.Value(0)).current;
  const chevronRot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(screenEnter, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [screenEnter, pulse]);

  const togglePeek = useCallback(() => {
    const next = !expanded;
    setExpanded(next);
    Animated.parallel([
      Animated.spring(peekProgress, {
        toValue: next ? 1 : 0,
        friction: 9,
        tension: 70,
        useNativeDriver: false,
      }),
      Animated.spring(chevronRot, {
        toValue: next ? 1 : 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [expanded, peekProgress, chevronRot]);

  const onPressIn = useCallback(() => {
    Animated.spring(cardScale, {
      toValue: 0.98,
      friction: 6,
      tension: 400,
      useNativeDriver: true,
    }).start();
  }, [cardScale]);

  const onPressOut = useCallback(() => {
    Animated.spring(cardScale, {
      toValue: 1,
      friction: 5,
      tension: 280,
      useNativeDriver: true,
    }).start();
  }, [cardScale]);

  const peekHeight = peekProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, PEEK_HEIGHT],
    extrapolate: 'clamp',
  });
  const peekOpacity = peekProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const chevronSpin = chevronRot.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const translateY = screenEnter.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0],
  });
  const fadeIn = screenEnter;

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: fadeIn,
              transform: [{ translateY }],
            }}
          >
            <Animated.View
              style={[
                styles.card,
                {
                  backgroundColor: theme.cardBaseAlpha,
                  borderColor: `${theme.percent}40`,
                  transform: [{ scale: cardScale }],
                },
                Shadows.card,
              ]}
            >
              <Pressable
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={styles.cardPressable}
              >
                <ChecklistHero
                  pulse={pulse}
                  accent={theme.percent}
                  secondary={theme.textPrimary}
                />

                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: `${theme.percent}18`,
                        borderColor: `${theme.percent}55`,
                      },
                    ]}
                  >
                    <View
                      style={[styles.badgeDot, { backgroundColor: theme.percent }]}
                    />
                    <Text
                      variant="caption"
                      style={[styles.badgeText, { color: theme.percent }]}
                    >
                      Coming soon
                    </Text>
                  </View>
                </View>

                <Text variant="title" color="primary" style={styles.cardHeadline}>
                  Tasks & goals
                </Text>
                <Text variant="body" color="secondary" style={styles.body}>
                  Monthly goals, today&apos;s tasks, and matching widgets are on the way.
                  We&apos;re building something you&apos;ll use every day.
                </Text>
              </Pressable>

              <TouchableOpacity
                onPress={togglePeek}
                activeOpacity={0.75}
                style={[
                  styles.peekTrigger,
                  { borderTopColor: theme.glassBorder },
                ]}
              >
                <Text variant="caption" color="primary" style={styles.peekLabel}>
                  What&apos;s planned
                </Text>
                <Animated.View style={{ transform: [{ rotate: chevronSpin }] }}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M6 9l6 6 6-6"
                      stroke={theme.textSecondary}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </Animated.View>
              </TouchableOpacity>

              <Animated.View
                style={[
                  styles.peekPanel,
                  {
                    maxHeight: peekHeight,
                    opacity: peekOpacity,
                    borderTopColor: theme.glassBorder,
                  },
                ]}
              >
                <Text variant="caption" color="muted" style={styles.peekIntro}>
                  A quick preview — tap above to collapse.
                </Text>
                <TeaserRow
                  label="Monthly goals with progress you can see at a glance"
                  index={0}
                  show={peekProgress}
                  accent={theme.percent}
                />
                <TeaserRow
                  label="Today’s task list tied to your goals"
                  index={1}
                  show={peekProgress}
                  accent={theme.percent}
                />
                <TeaserRow
                  label="Home screen & widget support when you need a nudge"
                  index={2}
                  show={peekProgress}
                  accent={theme.percent}
                />
              </Animated.View>
            </Animated.View>

            <Text variant="caption" color="muted" style={styles.hint}>
              Tip: pull down from Home anytime — the floating button stays one tap away.
            </Text>
          </Animated.View>
        </ScrollView>
      </ScreenGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingTop: Spacing[4],
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[7],
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing[4],
    overflow: 'hidden',
  },
  cardPressable: {
    paddingBottom: Spacing[2],
  },
  heroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    marginBottom: Spacing[3],
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontFamily: FontFamily.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontSize: Typography.badge,
  },
  cardHeadline: {
    textAlign: 'center',
    marginBottom: Spacing[2],
    fontFamily: FontFamily.medium,
  },
  body: {
    lineHeight: 23,
    textAlign: 'center',
  },
  peekTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: Spacing[3],
    marginTop: Spacing[1],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  peekLabel: {
    fontFamily: FontFamily.medium,
  },
  peekPanel: {
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing[3],
    marginHorizontal: -Spacing[1],
    paddingHorizontal: Spacing[2],
  },
  peekIntro: {
    marginBottom: Spacing[3],
    textAlign: 'center',
    lineHeight: 18,
  },
  teaserRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing[2],
    paddingRight: Spacing[2],
  },
  teaserDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: Spacing[2],
    opacity: 0.9,
  },
  teaserLabel: {
    flex: 1,
    lineHeight: 22,
  },
  hint: {
    marginTop: Spacing[4],
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing[2],
  },
});
