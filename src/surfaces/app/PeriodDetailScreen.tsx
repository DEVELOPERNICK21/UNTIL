import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
  Vibration,
  Dimensions,
} from 'react-native';
import {
  Text,
  ScreenGradient,
  GlassCard,
  ProgressLine,
  CircularProgress,
  PeriodGlyph,
} from '../../ui';
import type { PeriodGlyphKind } from '../../ui';
import {
  Spacing,
  Typography,
  FontFamily,
  getProgressColor,
  useTheme,
  feelForPeriod,
} from '../../theme';
import { useReduceMotion } from '../../hooks';

const RING_SIZE = Math.min(
  220,
  Dimensions.get('window').width - Spacing[4] * 2 - 32,
);

const PERSONALITY: Record<
  PeriodGlyphKind,
  { tagline: string; cue: string; accentHint: string }
> = {
  day: {
    tagline: 'Every second counts',
    cue: 'Live clock. Tap the ring to feel the pulse',
    accentHint: 'Seconds',
  },
  month: {
    tagline: 'Days of this month',
    cue: 'Tap stats to flip passed ↔ left',
    accentHint: 'Calendar',
  },
  year: {
    tagline: 'Orbit of the year',
    cue: 'A slow circle around 365 days',
    accentHint: 'Season',
  },
  life: {
    tagline: 'Your one run of days',
    cue: 'Heart-pace reminder of what you still have',
    accentHint: 'Heartbeat',
  },
};

export type PeriodDetailProps = {
  kind: PeriodGlyphKind;
  title: string;
  progress: number;
  passedLabel: string;
  leftLabel: string;
  passedCaption: string;
  leftCaption: string;
  summary: string;
  footer?: React.ReactNode;
  liveHint?: string;
  hero?: React.ReactNode;
};

/**
 * Shared playful shell for Day / Month / Year / Life detail screens.
 * Each kind has a light personality beat; Reduce Motion calms loops.
 */
export function PeriodDetailScreen({
  kind,
  title,
  progress,
  passedLabel,
  leftLabel,
  passedCaption,
  leftCaption,
  summary,
  footer,
  liveHint,
  hero,
}: PeriodDetailProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const progressColor = getProgressColor(progress);
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const personality = PERSONALITY[kind];
  const [glyphPressed, setGlyphPressed] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const enter = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const ringScale = useRef(new Animated.Value(reduceMotion ? 1 : 0.92)).current;
  const leftPulse = useRef(new Animated.Value(1)).current;
  const cardY = useRef(new Animated.Value(reduceMotion ? 0 : 24)).current;
  const persona = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      enter.setValue(1);
      ringScale.setValue(1);
      cardY.setValue(0);
      persona.setValue(1);
      return;
    }

    Animated.parallel([
      Animated.timing(enter, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(ringScale, {
        toValue: 1,
        friction: 6,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.timing(cardY, {
        toValue: 0,
        duration: 520,
        delay: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(persona, {
        toValue: 1,
        duration: 600,
        delay: 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const loop =
      kind === 'life'
        ? Animated.loop(
            Animated.sequence([
              Animated.timing(leftPulse, {
                toValue: 0.7,
                duration: 420,
                useNativeDriver: true,
              }),
              Animated.timing(leftPulse, {
                toValue: 1,
                duration: 420,
                useNativeDriver: true,
              }),
              Animated.delay(700),
            ]),
          )
        : kind === 'day'
          ? Animated.loop(
              Animated.sequence([
                Animated.timing(leftPulse, {
                  toValue: 0.85,
                  duration: 900,
                  useNativeDriver: true,
                }),
                Animated.timing(leftPulse, {
                  toValue: 1,
                  duration: 900,
                  useNativeDriver: true,
                }),
              ]),
            )
          : Animated.loop(
              Animated.sequence([
                Animated.timing(leftPulse, {
                  toValue: 0.78,
                  duration: 1400,
                  useNativeDriver: true,
                }),
                Animated.timing(leftPulse, {
                  toValue: 1,
                  duration: 1400,
                  useNativeDriver: true,
                }),
              ]),
            );
    loop.start();
    return () => loop.stop();
  }, [enter, ringScale, cardY, leftPulse, persona, kind, reduceMotion]);

  const bounceRing = () => {
    if (!reduceMotion) Vibration.vibrate(kind === 'life' ? 12 : 8);
    setGlyphPressed(true);
    Animated.sequence([
      Animated.spring(ringScale, {
        toValue: 1.06,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.spring(ringScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start(() => setGlyphPressed(false));
  };

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <Animated.ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          style={{ opacity: enter }}
        >
          <View style={styles.headerRow}>
            <PeriodGlyph
              kind={kind}
              size={36}
              progress={progress}
              accent={progressColor}
              pressed={glyphPressed}
              animated={!reduceMotion}
            />
            <View style={styles.headerCopy}>
              <Text
                variant="sectionTitle"
                color="secondary"
                style={styles.overhead}
              >
                {title}
              </Text>
              <Animated.View style={{ opacity: persona }}>
                <Text
                  variant="caption"
                  style={{ color: theme.percent }}
                >
                  {personality.tagline}
                </Text>
              </Animated.View>
            </View>
          </View>

          <View
            style={[
              styles.chip,
              {
                borderColor: theme.glassBorder,
                backgroundColor: theme.glassBg,
              },
            ]}
          >
            <Text variant="micro" color="secondary">
              {personality.accentHint}
            </Text>
          </View>

          {liveHint ? (
            <Text variant="caption" color="secondary" style={styles.liveHint}>
              {liveHint}
            </Text>
          ) : null}

          {hero != null ? (
            <View style={styles.heroWrap}>{hero}</View>
          ) : (
            <Pressable onPress={bounceRing} accessibilityRole="button">
              <Animated.View
                style={[styles.ringWrap, { transform: [{ scale: ringScale }] }]}
              >
                <CircularProgress
                  progress={progress}
                  size={RING_SIZE}
                  strokeWidth={14}
                  label={`${pct}%`}
                />
                <Text
                  variant="micro"
                  color="secondary"
                  style={styles.tapRingCue}
                >
                  {personality.cue}
                </Text>
              </Animated.View>
            </Pressable>
          )}

          <Pressable
            onPress={() => {
              if (!reduceMotion) Vibration.vibrate(6);
              setFlipped(f => !f);
            }}
          >
            <View style={styles.statsRow}>
              <GlassCard style={styles.statCard}>
                <Text
                  variant="caption"
                  color="secondary"
                  style={styles.statLabel}
                >
                  {flipped ? leftCaption : passedCaption}
                </Text>
                {flipped ? (
                  <Animated.View style={{ opacity: leftPulse }}>
                    <Text
                      variant="title"
                      style={[styles.bigValue, { color: progressColor }]}
                    >
                      {leftLabel}
                    </Text>
                  </Animated.View>
                ) : (
                  <Text variant="title" color="primary" style={styles.bigValue}>
                    {passedLabel}
                  </Text>
                )}
              </GlassCard>
              <GlassCard style={styles.statCard}>
                <Text
                  variant="caption"
                  color="secondary"
                  style={styles.statLabel}
                >
                  {flipped ? passedCaption : leftCaption}
                </Text>
                {flipped ? (
                  <Text variant="title" color="primary" style={styles.bigValue}>
                    {passedLabel}
                  </Text>
                ) : (
                  <Animated.View style={{ opacity: leftPulse }}>
                    <Text
                      variant="title"
                      style={[styles.bigValue, { color: progressColor }]}
                    >
                      {leftLabel}
                    </Text>
                  </Animated.View>
                )}
              </GlassCard>
            </View>
          </Pressable>

          <Animated.View style={{ transform: [{ translateY: cardY }] }}>
            <GlassCard style={styles.card}>
              <Text variant="body" color="secondary" style={styles.cardText}>
                {summary}
              </Text>
              <ProgressLine
                progress={progress}
                fillColor={progressColor}
                style={styles.progress}
              />
              <Text
                variant="caption"
                style={[styles.feelClose, { color: theme.percent }]}
              >
                {feelForPeriod(kind, progress)}
              </Text>
            </GlassCard>
          </Animated.View>

          {footer}
        </Animated.ScrollView>
      </ScreenGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[7],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  headerCopy: {
    gap: 2,
  },
  overhead: {
    letterSpacing: 0.4,
  },
  chip: {
    alignSelf: 'center',
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: Spacing[2],
  },
  liveHint: {
    textAlign: 'center',
    marginBottom: Spacing[3],
  },
  heroWrap: {
    width: '100%',
    marginBottom: Spacing[4],
    alignItems: 'center',
  },
  ringWrap: {
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  tapRingCue: {
    marginTop: Spacing[2],
    letterSpacing: 0.4,
    textAlign: 'center',
    paddingHorizontal: Spacing[3],
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    marginBottom: 0,
  },
  statLabel: {
    letterSpacing: 0.8,
    marginBottom: 4,
    fontSize: Typography.badge,
  },
  bigValue: {
    fontSize: Typography.display,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
  card: {
    marginBottom: Spacing[4],
  },
  cardText: {
    marginBottom: Spacing[2],
  },
  progress: {
    marginTop: Spacing[1],
    marginBottom: Spacing[3],
  },
  feelClose: {
    fontStyle: 'italic',
    lineHeight: 18,
    textAlign: 'center',
  },
});
