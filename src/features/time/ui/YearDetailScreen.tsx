import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, PeriodDotsGrid } from '../../../shared/ui';
import { PeriodDetailScreen } from './PeriodDetailScreen';
import { useObserveTimeState } from '../hooks/useObserveTimeState';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { Spacing, useTheme, getProgressColor } from '../../../shared/theme';

function getDaysInYear(): number {
  const y = new Date().getFullYear();
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365;
}

export function YearDetailScreen() {
  const theme = useTheme();
  const { t, formatNumber } = useTranslation();
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
  const counts = { passed: passedDays, total: daysInYear };

  return (
    <PeriodDetailScreen
      kind="year"
      title={t('nav.thisYear')}
      progress={progress}
      passedLabel={`${passedDays}`}
      leftLabel={`${remainingDaysYear}`}
      passedCaption={t('detail.daysPassed')}
      leftCaption={t('detail.daysLeft')}
      summary={t('detail.year.summary', { ...counts, left: 100 - pct })}
      hero={
        <View style={styles.hero}>
          <Text
            variant="sectionTitle"
            style={[styles.heroDays, { color: fillColor ?? theme.percent }]}
          >
            {t('detail.year.hero', {
              passed: formatNumber(passedDays),
              total: formatNumber(daysInYear),
            })}
          </Text>
          <PeriodDotsGrid
            filledCount={passedDays}
            totalCount={daysInYear}
            fillColor={fillColor}
            accessibilityLabel={t('detail.year.dotsLabel', counts)}
          />
        </View>
      }
      footer={
        <Text variant="caption" color="secondary" style={styles.hint}>
          {t('detail.year.hint')}
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
