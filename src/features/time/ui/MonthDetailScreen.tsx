import React from 'react';
import { Text } from '../../../shared/ui';
import { PeriodDetailScreen } from './PeriodDetailScreen';
import { useObserveTimeState } from '../hooks/useObserveTimeState';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { Spacing } from '../../../shared/theme';
import { StyleSheet } from 'react-native';

function getDaysInMonth(): number {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function MonthDetailScreen() {
  const { t } = useTranslation();
  const { timeState } = useObserveTimeState();

  const remainingDaysMonth = timeState.remainingDaysMonth ?? 0;
  const daysInMonth = getDaysInMonth();
  const passedDays = daysInMonth - remainingDaysMonth;
  const progress = timeState.month ?? 0;
  const pct = Math.round(progress * 100);

  return (
    <PeriodDetailScreen
      kind="month"
      title={t('nav.thisMonth')}
      progress={progress}
      passedLabel={`${passedDays}`}
      leftLabel={`${remainingDaysMonth}`}
      passedCaption={t('detail.daysPassed')}
      leftCaption={t('detail.daysLeft')}
      summary={t('detail.month.summary', {
        passed: passedDays,
        total: daysInMonth,
        left: 100 - pct,
      })}
      footer={
        <Text variant="caption" color="secondary" style={styles.hint}>
          {t('detail.month.hint')}
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
