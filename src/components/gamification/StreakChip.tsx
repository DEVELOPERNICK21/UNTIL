import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { StreakFlame, Text, useReduceMotion } from '../../ui';
import { FontFamily, Spacing, useTheme } from '../../theme';

const CELEBRATE_DELAY_MS = 550;
const CELEBRATE_DONE_MS = 1700;

interface StreakChipProps {
  count: number;
  /** Today is counted. Dim flame when false. */
  lit: boolean;
  /** Play the "new day counted" moment once. */
  celebrate: boolean;
  onCelebrated: () => void;
  onPress: () => void;
}

/**
 * Home streak chip. On the first view of a new day the number rolls up from
 * yesterday's count with a flame pop.
 */
export function StreakChip({
  count,
  lit,
  celebrate,
  onCelebrated,
  onPress,
}: StreakChipProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  // Roll up from yesterday's number. Day one has nothing to roll from.
  const from = count > 1 ? count - 1 : count;
  const [shown, setShown] = useState(celebrate && !reduceMotion ? from : count);
  const [burstKey, setBurstKey] = useState<number | null>(null);
  const numberScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!celebrate) {
      setShown(count);
      return;
    }
    if (reduceMotion) {
      setShown(count);
      onCelebrated();
      return;
    }
    setShown(from);
    const start = setTimeout(() => {
      setShown(count);
      setBurstKey(count);
      Animated.sequence([
        Animated.spring(numberScale, {
          toValue: 1.35,
          friction: 4,
          tension: 260,
          useNativeDriver: true,
        }),
        Animated.spring(numberScale, {
          toValue: 1,
          friction: 5,
          tension: 140,
          useNativeDriver: true,
        }),
      ]).start();
    }, CELEBRATE_DELAY_MS);
    const done = setTimeout(onCelebrated, CELEBRATE_DONE_MS);
    return () => {
      clearTimeout(start);
      clearTimeout(done);
    };
  }, [celebrate, count, from, reduceMotion, onCelebrated, numberScale]);

  const chipStyle = {
    backgroundColor: theme.glassBg,
    borderColor: theme.glassBorder,
  };
  const numberStyle = { transform: [{ scale: numberScale }] };
  const label = `${count} day streak${lit ? '' : ', not counted yet today'}. Open badges.`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.chip, chipStyle]}
    >
      <StreakFlame size={28} lit={lit} burstKey={burstKey} />
      <View style={styles.copy}>
        <Animated.View style={numberStyle}>
          <Text variant="cardValue" color="primary" style={styles.number}>
            {shown}
          </Text>
        </Animated.View>
        <Text variant="micro" color="secondary">
          {count === 1 ? 'day' : 'days'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    paddingLeft: Spacing[2],
    paddingRight: Spacing[2] + 2,
    paddingVertical: Spacing[1],
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  copy: {
    alignItems: 'flex-start',
  },
  number: {
    fontFamily: FontFamily.medium,
    lineHeight: 22,
  },
});
