import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Vibration,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ConfettiBurst, GlassCard, ProgressRing, Text, useReduceMotion } from '../../ui';
import { FontFamily, Spacing, useTheme } from '../../theme';
import type {
  DailyQuest,
  DailyQuests,
  QuestId,
} from '../../domain/badges/dailyQuests';

const RING_SIZE = 64;
const CONFETTI_COLORS = ['#E87C20', '#FDBA74', '#FFE699', '#22AA22', '#FFFFFF'];

function QuestCheck({ done }: { done: boolean }) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const pop = useRef(new Animated.Value(done ? 1 : 0)).current;
  const wasDone = useRef(done);

  useEffect(() => {
    if (reduceMotion) {
      pop.setValue(done ? 1 : 0);
      wasDone.current = done;
      return;
    }
    if (done && !wasDone.current) {
      pop.setValue(0);
      Animated.spring(pop, {
        toValue: 1,
        friction: 4,
        tension: 200,
        useNativeDriver: true,
      }).start();
    } else if (!done) {
      pop.setValue(0);
    }
    wasDone.current = done;
  }, [done, reduceMotion, pop]);

  const fillStyle = {
    backgroundColor: theme.success,
    opacity: pop.interpolate({ inputRange: [0, 0.4], outputRange: [0, 1] }),
    transform: [{ scale: pop }],
  };
  const ringStyle = { borderColor: done ? theme.success : theme.textMuted };

  return (
    <View style={[styles.check, ringStyle]}>
      <Animated.View style={[styles.checkFill, fillStyle]}>
        <Svg width={12} height={12} viewBox="0 0 12 12">
          <Path
            d="M2.4 6.3 L5 8.8 L9.6 3.4"
            stroke="#FFFFFF"
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

function QuestRow({
  quest,
  onPress,
}: {
  quest: DailyQuest;
  onPress?: () => void;
}) {
  const tappable = !quest.done && onPress != null;
  const body = (
    <View style={styles.row}>
      <QuestCheck done={quest.done} />
      <Text
        variant="body"
        color={quest.done ? 'secondary' : 'primary'}
        style={styles.rowLabel}
      >
        {quest.label}
      </Text>
      {quest.detail ? (
        <Text variant="caption" color="secondary">
          {quest.detail}
        </Text>
      ) : null}
    </View>
  );
  if (!tappable) return body;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${quest.label}. ${quest.detail}`.trim()}
    >
      {body}
    </Pressable>
  );
}

interface DailyQuestsCardProps {
  quests: DailyQuests;
  onQuestPress: (id: QuestId) => void;
}

/**
 * Today's three quests with a ring that fills as they finish. Fires confetti
 * the moment the last one is done (not when the screen first opens that way).
 */
export function DailyQuestsCard({ quests, onQuestPress }: DailyQuestsCardProps) {
  const reduceMotion = useReduceMotion();
  const wasAllDone = useRef(quests.allDone);
  const [burstKey, setBurstKey] = useState<number | null>(null);

  useEffect(() => {
    if (quests.allDone && !wasAllDone.current) {
      setBurstKey(Date.now());
      if (!reduceMotion) Vibration.vibrate(12);
    }
    wasAllDone.current = quests.allDone;
  }, [quests.allDone, reduceMotion]);

  const summary = quests.allDone
    ? 'All done for today.'
    : `${quests.doneCount} of ${quests.quests.length} done`;

  return (
    <View style={styles.wrap}>
      <GlassCard style={styles.card}>
        <View style={styles.head}>
          <ProgressRing progress={quests.ratio} size={RING_SIZE} strokeWidth={6}>
            <Text variant="sectionTitle" color="primary" style={styles.ringText}>
              {quests.doneCount}/{quests.quests.length}
            </Text>
          </ProgressRing>
          <View style={styles.headCopy}>
            <Text variant="sectionTitle" color="primary">
              Today
            </Text>
            <Text variant="caption" color="secondary">
              {summary}
            </Text>
          </View>
        </View>
        <View style={styles.list}>
          {quests.quests.map(q => (
            <QuestRow
              key={q.id}
              quest={q}
              onPress={q.id === 'checkin' ? undefined : () => onQuestPress(q.id)}
            />
          ))}
        </View>
      </GlassCard>
      <View pointerEvents="none" style={styles.confettiAnchor}>
        <ConfettiBurst
          burstKey={burstKey}
          colors={CONFETTI_COLORS}
          radius={150}
          count={30}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing[2],
  },
  card: {
    padding: Spacing[3],
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[2],
  },
  headCopy: {
    flex: 1,
  },
  ringText: {
    fontFamily: FontFamily.medium,
  },
  list: {
    gap: Spacing[1],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    minHeight: 34,
  },
  rowLabel: {
    flex: 1,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  checkFill: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Sits on the ring (card padding + half the ring) so the burst starts there.
  confettiAnchor: {
    position: 'absolute',
    top: Spacing[3] + RING_SIZE / 2,
    left: Spacing[3] + RING_SIZE / 2,
    width: 0,
    height: 0,
  },
});
