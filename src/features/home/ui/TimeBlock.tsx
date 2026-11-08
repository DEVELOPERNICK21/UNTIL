import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Pressable } from 'react-native';
import {
  Text,
  GlassCard,
  PeriodGlyph,
  PeriodCardBackdrop,
} from '../../../shared/ui';
import type { PeriodGlyphKind } from '../../../shared/ui';
import { Spacing, FontFamily, getProgressColor } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';

/**
 * The period tiles on Home. Today is wide, Month, Year and Life share a row of three, so all four
 * show above the fold. `compact` tiles drop the glyph a size and shrink the number to fit.
 */
export type TileSize = 'wide' | 'normal' | 'compact';

interface BlockProps {
  title: string;
  glyph: PeriodGlyphKind;
  passedLabel: string;
  leftLabel: string;
  progress: number;
  passedPct: number;
  leftPct: number;
  index?: number;
  scrollY?: Animated.Value;
  reduceMotion?: boolean;
  size?: TileSize;
  onPress?: () => void;
}

function scrollRevealStyle(
  scrollY: Animated.Value | undefined,
  index: number,
) {
  if (!scrollY) {
    return undefined;
  }
  // Motion only — no opacity fade (kept cards uneven / washed out down the list).
  const mid = Math.max(0, index * 72) + 90;
  return {
    transform: [
      {
        translateY: scrollY.interpolate({
          inputRange: [0, mid, mid + 160],
          outputRange: [0, -4 * Math.min(index, 2) * 0.35, -8],
          extrapolate: 'clamp' as const,
        }),
      },
    ],
  };
}

export const TimeBlock = React.memo(function TimeBlock({
  title,
  glyph,
  passedLabel,
  leftLabel,
  progress,
  leftPct,
  index = 0,
  scrollY,
  reduceMotion = false,
  size = 'normal',
  onPress,
}: BlockProps) {
  const { t } = useTranslation();
  const compact = size === 'compact';
  const wide = size === 'wide';
  const progressColor = getProgressColor(progress);
  const leftColor = getProgressColor(progress);
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const enterY = useRef(new Animated.Value(reduceMotion ? 0 : 14)).current;
  const reveal = reduceMotion ? undefined : scrollRevealStyle(scrollY, index);
  const [pressed, setPressed] = useState(false);
  const pressScale = useRef(new Animated.Value(1)).current;

  const springTo = React.useCallback(
    (toValue: number) => {
      if (reduceMotion) return;
      Animated.spring(pressScale, {
        toValue,
        friction: 6,
        tension: 260,
        useNativeDriver: true,
      }).start();
    },
    [pressScale, reduceMotion],
  );

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      enterY.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay: 50 + index * 55,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(enterY, {
        toValue: 0,
        duration: 460,
        delay: 50 + index * 55,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, enterY, index, reduceMotion]);

  const content = (
    <GlassCard style={[styles.tile, compact && styles.tileCompact]}>
      <PeriodCardBackdrop kind={glyph} />
      <View style={styles.tileTop}>
        <PeriodGlyph
          kind={glyph}
          size={compact ? 22 : wide ? 32 : 28}
          accent={progressColor}
          progress={progress}
          pressed={pressed}
          animated={!reduceMotion}
        />
        <Text variant="caption" color="secondary" style={styles.tileTitle}>
          {title}
        </Text>
      </View>
      <Text
        variant="title"
        numberOfLines={compact ? 1 : 2}
        adjustsFontSizeToFit={compact}
        minimumFontScale={0.6}
        style={[
          styles.tileValue,
          wide && styles.tileValueWide,
          compact && styles.tileValueCompact,
          { color: leftColor },
        ]}
        accessibilityRole="text"
      >
        {leftLabel}
      </Text>
      <Text variant="micro" color="secondary">
        {t('home.percentLeft', { percent: leftPct })}
      </Text>
    </GlassCard>
  );

  return (
    <Animated.View style={[styles.tileAnim, { opacity, transform: [{ translateY: enterY }] }]}>
      <Animated.View style={reveal}>
        {onPress ? (
          <Pressable
            onPress={onPress}
            onPressIn={() => {
              setPressed(true);
              springTo(0.96);
            }}
            onPressOut={() => {
              setPressed(false);
              springTo(1);
            }}
            accessibilityRole="button"
            accessibilityLabel={t('home.tileA11y', {
              title,
              left: leftLabel,
              passed: passedLabel,
            })}
          >
            <Animated.View style={{ transform: [{ scale: pressScale }] }}>
              {content}
            </Animated.View>
          </Pressable>
        ) : (
          content
        )}
      </Animated.View>
    </Animated.View>
  );
});

/** The Life tile when it cannot show a number yet: no birth date, or Life is a premium feature. */
export function LockedLifeTile({
  label,
  accessibilityLabel,
  reduceMotion,
  size = 'normal',
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  reduceMotion: boolean;
  size?: TileSize;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const compact = size === 'compact';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <GlassCard style={[styles.tile, compact && styles.tileCompact]}>
        <PeriodCardBackdrop kind="life" />
        <View style={styles.tileTop}>
          <PeriodGlyph kind="life" size={compact ? 22 : 28} animated={!reduceMotion} />
          <Text variant="caption" color="secondary" style={styles.tileTitle}>
            {t('home.tile.life')}
          </Text>
        </View>
        <Text variant="caption" color="primary" numberOfLines={compact ? 2 : 1}>
          {label}
        </Text>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tileAnim: {
    width: '100%',
  },
  tile: {
    minHeight: 118,
    padding: Spacing[2],
  },
  tileCompact: {
    minHeight: 104,
  },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    marginBottom: Spacing[2],
  },
  tileTitle: {
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  tileValue: {
    fontFamily: FontFamily.medium,
    fontSize: 20,
    marginBottom: 2,
  },
  tileValueWide: {
    fontSize: 30,
  },
  tileValueCompact: {
    fontSize: 16,
  },
});
