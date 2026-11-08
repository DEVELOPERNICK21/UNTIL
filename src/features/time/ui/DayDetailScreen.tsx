import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from '../../../shared/ui';
import { PeriodDetailScreen } from './PeriodDetailScreen';
import { useObserveTimeState } from '../hooks/useObserveTimeState';
import { useGoalsFeatureEnabled } from '../../../shared/featureFlags/useGoalsFeatureEnabled';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import type { t as translateFn } from '../../../shared/i18n/translate';
import { Spacing } from '../../../shared/theme';
import type { RootStackParamList } from '../../../shared/navigation/types';

function formatTime(date: Date, t: typeof translateFn) {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setHours(23, 59, 59, 999);
  const start = startDate.getTime();
  const end = endDate.getTime();
  const passedMs = date.getTime() - start;
  const remainingMs = Math.max(0, end - date.getTime());
  const totalMs = Math.max(1, end - start);
  const passedS = Math.floor(passedMs / 1000);
  const remainingS = Math.floor(remainingMs / 1000);
  const clock = (n: number) =>
    t('detail.clock', {
      h: Math.floor(n / 3600),
      m: Math.floor((n % 3600) / 60),
      s: n % 60,
    });
  return {
    passed: clock(passedS),
    left: clock(remainingS),
    progress: Math.min(1, Math.max(0, passedMs / totalMs)),
  };
}

export function DayDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'DayDetail'>>();
  const { t } = useTranslation();
  const [live, setLive] = useState(() => new Date());
  const goalsFeatureEnabled = useGoalsFeatureEnabled();
  useObserveTimeState();

  useEffect(() => {
    const timer = setInterval(() => setLive(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { passed, left, progress } = formatTime(live, t);
  const pctDone = Math.round(progress * 100);
  const pctLeft = 100 - pctDone;

  return (
    <PeriodDetailScreen
      kind="day"
      title={t('nav.today')}
      progress={progress}
      passedLabel={passed}
      leftLabel={left}
      passedCaption={t('detail.passed')}
      leftCaption={t('detail.left')}
      summary={t('detail.day.summary', { done: pctDone, left: pctLeft })}
      liveHint={t('detail.day.liveHint')}
      footer={
        <TouchableOpacity
          style={styles.cta}
          onPress={() => {
            if (goalsFeatureEnabled) {
              navigation.navigate('DailyTasks');
            } else {
              Alert.alert(
                t('detail.comingSoon'),
                t('detail.day.comingSoonMessage'),
              );
            }
          }}
        >
          <Text variant="sectionTitle" color="primary">
            {t('nav.todaysTasks')}
          </Text>
          <Text variant="caption" color="secondary">
            {t('detail.day.tasksCta')}
          </Text>
        </TouchableOpacity>
      }
    />
  );
}

const styles = StyleSheet.create({
  cta: {
    marginTop: Spacing[2],
    paddingVertical: Spacing[3],
  },
});
