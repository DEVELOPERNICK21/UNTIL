import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TimeStatement, Text } from '../../ui';
import { useObserveTimeState, useLogActivity, useObserveCategoryTotals, useRegretProjection, useInterventionState } from '../../hooks';
import { Colors, Spacing } from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import type { ActivityCategory } from '../../types';

const SWIPE_THRESHOLD = 60;

const CATEGORIES: { key: ActivityCategory; label: string }[] = [
  { key: 'work', label: 'Work' },
  { key: 'sleep', label: 'Sleep' },
  { key: 'social', label: 'Social' },
  { key: 'gym', label: 'Gym' },
  { key: 'nothing', label: 'Nothing' },
];

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();
  const { timeState } = useObserveTimeState();
  const { startCategory, endCurrent } = useLogActivity();
  const categoryTotals = useObserveCategoryTotals();
  const { projection, hasEnoughData } = useRegretProjection();
  const intervention = useInterventionState();
  const [view, setView] = useState<'primary' | 'secondary'>('primary');
  const [tagExpanded, setTagExpanded] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
      onPanResponderRelease: (_, gestureState) => {
        const { dy } = gestureState;
        if (dy < -SWIPE_THRESHOLD) setView('secondary');
        else if (dy > SWIPE_THRESHOLD) setView('primary');
      },
    })
  ).current;

  const remainingHours = timeState.remainingHours ?? Math.floor((1 - timeState.day) * 24);
  const remainingDaysYear = timeState.remainingDaysYear ?? 0;
  const remainingDaysMonth = timeState.remainingDaysMonth ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        {...panResponder.panHandlers}
      >
        {view === 'primary' ? (
          <>
            <TimeStatement
              label="Today"
              value={`${remainingHours} hours`}
              suffix="remaining"
              emphasis="primary"
              showProgress
              progress={timeState.day}
            />
            <View style={styles.secondaryBlock}>
              <TimeStatement
                label="This year"
                value={`${remainingDaysYear} days`}
                suffix="remaining"
                emphasis="secondary"
                onPress={() => setView('secondary')}
              />
            </View>
            <TouchableOpacity
              style={styles.affordance}
              onPress={() => setView('secondary')}
            >
              <Text variant="meta" color="secondary">Swipe for more</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TimeStatement
              label="This month"
              value={`${remainingDaysMonth} days`}
              suffix="remaining"
              emphasis="secondary"
              showProgress
              progress={timeState.month}
            />
            <TimeStatement
              label="This year"
              value={`${remainingDaysYear} days`}
              suffix="remaining"
              emphasis="secondary"
              showProgress
              progress={timeState.year}
            />
            {hasEnoughData && projection && (
              <View style={styles.projectionBlock}>
                <Text variant="secondaryBlock" color="secondary" style={styles.projectionLabel}>
                  If you continue
                </Text>
                <Text variant="secondaryValue" color="primary">
                  {projection.daysWastedThisYear} days this year
                </Text>
                <Text variant="meta" color="secondary">
                  {projection.daysWastedByAge} days by age {projection.targetAge}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.affordance} onPress={() => setView('primary')}>
              <Text variant="meta" color="secondary">Swipe to go back</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.lifeLink}
          onPress={() => navigation.navigate('Life')}
        >
          <Text variant="meta" color="secondary">Your life</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, intervention.shouldShowRed && styles.fabRed]}
          onPress={() => setTagExpanded(!tagExpanded)}
          activeOpacity={0.8}
        >
          <Text variant="meta" color="primary">Tag</Text>
        </TouchableOpacity>
        {tagExpanded && (
          <View style={styles.chipRow}>
            {CATEGORIES.map(({ key, label }) => {
              const isActive = categoryTotals.currentCategory === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => {
                    if (isActive) endCurrent();
                    else startCategory(key);
                  }}
                >
                  <Text variant="meta" color={isActive ? 'primary' : 'secondary'}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  secondaryBlock: {
    marginTop: Spacing.lg,
  },
  affordance: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  lifeLink: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginTop: Spacing.lg,
  },
  fabContainer: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
    alignItems: 'flex-end',
  },
  fab: {
    backgroundColor: Colors.divider,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
    marginRight: -Spacing.sm,
    marginBottom: -Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.divider,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  chipActive: {
    borderWidth: 1,
    borderColor: Colors.primaryText,
  },
  fabRed: {
    borderWidth: 2,
    borderColor: '#AA2222',
  },
  projectionBlock: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  projectionLabel: {
    marginBottom: Spacing.sm,
  },
});
