import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '../../ui';
import { PeriodDetailScreen } from './PeriodDetailScreen';
import { useObserveTimeState } from '../../hooks';
import { Spacing } from '../../theme';

function getDaysInYear(): number {
  const y = new Date().getFullYear();
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365;
}

export function YearDetailScreen() {
  const { timeState } = useObserveTimeState();

  const remainingDaysYear = timeState.remainingDaysYear ?? 0;
  const daysInYear = getDaysInYear();
  const passedDays = daysInYear - remainingDaysYear;
  const progress = timeState.year ?? 0;
  const pct = Math.round(progress * 100);

  return (
    <PeriodDetailScreen
      kind="year"
      title="This year"
      progress={progress}
      passedLabel={`${passedDays}`}
      leftLabel={`${remainingDaysYear}`}
      passedCaption="DAYS PASSED"
      leftCaption="DAYS LEFT"
      summary={`${passedDays} of ${daysInYear} days · ${100 - pct}% of year remaining`}
      footer={
        <Text variant="caption" color="secondary" style={styles.hint}>
          The Year widget shows all 365 days at a glance. Add it from Widgets.
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
