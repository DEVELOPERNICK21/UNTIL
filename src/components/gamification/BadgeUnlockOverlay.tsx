import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  BackHandler,
  Easing,
  Pressable,
  StyleSheet,
  Vibration,
  View,
} from 'react-native';
import { BadgeMedal, ConfettiBurst, TIER_CONFETTI, Text, useReduceMotion } from '../../ui';
import { FontFamily, Radius, Spacing, useTheme } from '../../theme';
import type { BadgeView } from '../../domain/useCases/GetBadgesUseCase';
import { formatEarnedDate, progressLabel } from './badgeLabels';

const MEDAL_SIZE = 132;

interface BadgeUnlockOverlayProps {
  /** Badge to show. Null keeps the overlay hidden. */
  badge: BadgeView | null;
  /** `unlock` celebrates a new badge. `detail` just describes one. */
  mode: 'unlock' | 'detail';
  /** Other unlocks waiting behind this one. */
  remaining?: number;
  earnedCount: number;
  total: number;
  onClose: () => void;
}

/**
 * Full-screen badge moment: dim backdrop, medal flips in, confetti, then the
 * text. Drawn inside the screen (not a native Modal) so it never fights the
 * app's other modals for the iOS presentation slot.
 */
export function BadgeUnlockOverlay({
  badge,
  mode,
  remaining = 0,
  earnedCount,
  total,
  onClose,
}: BadgeUnlockOverlayProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const backdrop = useRef(new Animated.Value(0)).current;
  const card = useRef(new Animated.Value(0)).current;
  const flip = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;

  const id = badge?.definition.id ?? null;
  const celebrate = mode === 'unlock';

  useEffect(() => {
    if (!badge) return;
    AccessibilityInfo.announceForAccessibility(
      celebrate
        ? `New badge. ${badge.definition.title}. ${badge.definition.description}`
        : badge.definition.title,
    );
    if (reduceMotion) {
      backdrop.setValue(1);
      card.setValue(1);
      flip.setValue(1);
      reveal.setValue(1);
      return;
    }
    backdrop.setValue(0);
    card.setValue(0);
    flip.setValue(0);
    reveal.setValue(0);
    const run = Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.spring(card, {
        toValue: 1,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(180),
        Animated.spring(flip, {
          toValue: 1,
          friction: 5,
          tension: 70,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(reveal, {
        toValue: 1,
        duration: 420,
        delay: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    run.start();
    if (celebrate) Vibration.vibrate(14);
    return () => run.stop();
    // Replay only when a different badge is shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, celebrate, reduceMotion]);

  useEffect(() => {
    if (!badge) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [badge, onClose]);

  if (!badge) return null;

  const { definition } = badge;
  const earnedOn = formatEarnedDate(badge.earnedOn);

  const backdropStyle = { opacity: backdrop };
  const cardStyle = {
    backgroundColor: theme.cardBase,
    borderColor: theme.glassBorder,
    opacity: card,
    transform: [
      {
        translateY: card.interpolate({
          inputRange: [0, 1],
          outputRange: [36, 0],
        }),
      },
      {
        scale: card.interpolate({
          inputRange: [0, 1],
          outputRange: [0.9, 1],
        }),
      },
    ],
  };
  const medalStyle = {
    opacity: flip.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 1, 1] }),
    transform: [
      { perspective: 700 },
      {
        rotateY: flip.interpolate({
          inputRange: [0, 1],
          outputRange: ['-100deg', '0deg'],
        }),
      },
      {
        scale: flip.interpolate({
          inputRange: [0, 1],
          outputRange: [0.6, 1],
        }),
      },
    ],
  };
  const textStyle = {
    opacity: reveal,
    transform: [
      {
        translateY: reveal.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };
  const buttonStyle = { backgroundColor: theme.percent };

  const headline = celebrate
    ? 'New badge'
    : badge.earned
    ? `Earned ${earnedOn}`
    : progressLabel(badge);
  const detailLine = celebrate
    ? `${earnedCount} of ${total} earned`
    : badge.earned
    ? ''
    : definition.description;

  return (
    <View
      style={styles.root}
      accessibilityViewIsModal
      importantForAccessibility="yes"
    >
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable
          style={styles.backdropHit}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
      </Animated.View>
      <Animated.View style={[styles.card, cardStyle]}>
        <Text variant="caption" color="secondary" style={styles.overline}>
          {headline}
        </Text>
        <View style={styles.medalStage}>
          <Animated.View style={medalStyle}>
            <BadgeMedal
              glyph={definition.glyph}
              tier={definition.tier}
              size={MEDAL_SIZE}
              locked={!badge.earned}
              progress={badge.earned ? undefined : badge.progress.ratio}
              shine={badge.earned ? 'loop' : 'none'}
            />
          </Animated.View>
          {celebrate ? (
            <ConfettiBurst
              burstKey={id}
              colors={TIER_CONFETTI[definition.tier]}
              radius={170}
              count={34}
            />
          ) : null}
        </View>
        <Animated.View style={[styles.textBlock, textStyle]}>
          <Text variant="title" color="primary" style={styles.title}>
            {definition.title}
          </Text>
          <Text variant="body" color="secondary" style={styles.body}>
            {celebrate || badge.earned ? definition.description : detailLine}
          </Text>
          {celebrate ? (
            <Text variant="caption" color="secondary">
              {detailLine}
            </Text>
          ) : null}
        </Animated.View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={
            remaining > 0 ? `Next badge, ${remaining} more` : 'Close'
          }
          style={[styles.button, buttonStyle]}
        >
          <Text variant="body" style={styles.buttonText}>
            {celebrate ? (remaining > 0 ? `Next (${remaining} more)` : 'Nice') : 'Close'}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    elevation: 50,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
  },
  backdropHit: {
    flex: 1,
  },
  card: {
    width: '84%',
    maxWidth: 340,
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[3],
    borderRadius: Radius.lg + 4,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  overline: {
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  medalStage: {
    width: MEDAL_SIZE + 40,
    height: MEDAL_SIZE + 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap: Spacing[1],
    marginBottom: Spacing[3],
  },
  title: {
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    lineHeight: 21,
  },
  button: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: Spacing[2] + 2,
    borderRadius: Radius.full,
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.medium,
  },
});
