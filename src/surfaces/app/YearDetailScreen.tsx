import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, PeriodDotsGrid } from '../../ui';
import { PeriodDetailScreen } from './PeriodDetailScreen';
import { useObserveTimeState } from '../../hooks';
import { Spacing, useTheme, getProgressColor } from '../../theme';

function getDaysInYear(): number {
  const y = new Date().getFullYear();
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365;
}

export function YearDetailScreen() {
  const theme = useTheme();
  const { timeState } = useObserveTimeState();

  const remainingDaysYear = timeState.remainingDaysYear ?? 0;
  const daysInYear = getDaysInYear();
  const passedDays = Math.max(
    0,
    Math.min(daysInYear, daysInYear - remainingDaysYear),
  );
  const progress = timeState.year ?? 0;
  const pct = Math.round(progress * 100);
  const fillColor = getProgressColor(progress);
  const passedLabel = passedDays.toLocaleString();
  const totalLabel = daysInYear.toLocaleString();

  return (
    <PeriodDetailScreen
      kind="year"
      title="This year"
      progress={progress}
      passedLabel={`${passedDays}`}
      leftLabel={`${remainingDaysYear}`}
      passedCaption="Days passed"
      leftCaption="Days left"
      summary={`${passedDays} of ${daysInYear} days · ${100 - pct}% of year remaining`}
      hero={
        <View style={styles.hero}>
          <Text
            variant="sectionTitle"
            style={[styles.heroDays, { color: fillColor ?? theme.percent }]}
          >
            {passedLabel} / {totalLabel} days
          </Text>
          <PeriodDotsGrid
            filledCount={passedDays}
            totalCount={daysInYear}
            fillColor={fillColor}
            accessibilityLabel={`${passedDays} of ${daysInYear} days passed`}
          />
        </View>
      }
      footer={
        <Text variant="caption" color="secondary" style={styles.hint}>
          The Year widget shows all 365 days at a glance. Add it from Widgets.
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    alignItems: 'center',
  },
  heroDays: {
    textAlign: 'center',
    marginBottom: Spacing[5],
  },
  hint: {
    paddingHorizontal: Spacing[2],
    textAlign: 'center',
  },
});
