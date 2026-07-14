import React from 'react';
import { Text } from '../../ui';
import { PeriodDetailScreen } from './PeriodDetailScreen';
import { useObserveTimeState } from '../../hooks';
import { Spacing } from '../../theme';
import { StyleSheet } from 'react-native';

function getDaysInMonth(): number {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function MonthDetailScreen() {
  const { timeState } = useObserveTimeState();

  const remainingDaysMonth = timeState.remainingDaysMonth ?? 0;
  const daysInMonth = getDaysInMonth();
  const passedDays = daysInMonth - remainingDaysMonth;
  const progress = timeState.month ?? 0;
  const pct = Math.round(progress * 100);

  return (
    <PeriodDetailScreen
      kind="month"
      title="This month"
      progress={progress}
      passedLabel={`${passedDays}`}
      leftLabel={`${remainingDaysMonth}`}
      passedCaption="DAYS PASSED"
      leftCaption="DAYS LEFT"
      summary={`${passedDays} of ${daysInMonth} days · ${100 - pct}% of month remaining`}
      footer={
        <Text variant="caption" color="secondary" style={styles.hint}>
          The Month widget shows this same progress on your home screen.
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  hint: {
    paddingHorizontal: Spacing[2],
    textAlign: 'center',
  },
});
