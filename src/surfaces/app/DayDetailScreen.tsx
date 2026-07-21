import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from '../../ui';
import { PeriodDetailScreen } from './PeriodDetailScreen';
import { useObserveTimeState, useGoalsFeatureEnabled } from '../../hooks';
import { Spacing, Typography, FontFamily, getProgressColor } from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';

function formatTime(date: Date) {
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
  const h = (n: number) => Math.floor(n / 3600);
  const m = (n: number) => Math.floor((n % 3600) / 60);
  const s = (n: number) => n % 60;
  return {
    passed: `${h(passedS)}h ${m(passedS)}m ${s(passedS)}s`,
    left: `${h(remainingS)}h ${m(remainingS)}m ${s(remainingS)}s`,
    progress: Math.min(1, Math.max(0, passedMs / totalMs)),
  };
}

const LiveDayLabel = React.memo(function LiveDayLabelInternal({
  type,
  color,
}: {
  type: 'passed' | 'left';
  color?: string;
}) {
  const [live, setLive] = useState(() => new Date());

  useEffect(() => {
    // 1-second interval timer is isolated to this tiny sub-component
    const t = setInterval(() => setLive(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { passed, left } = formatTime(live);
  const text = type === 'passed' ? passed : left;

  return (
    <Text
      variant="title"
      style={[
        styles.bigValue,
        color ? { color } : undefined,
      ]}
    >
      {text}
    </Text>
  );
});

export function DayDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'DayDetail'>>();
  const goalsFeatureEnabled = useGoalsFeatureEnabled();
  useObserveTimeState();

  // Initialize a static date for render-once on other components (e.g., circular progress, progress line)
  const [initialDate] = useState(() => new Date());
  const { progress } = formatTime(initialDate);
  const pctDone = Math.round(progress * 100);
  const pctLeft = 100 - pctDone;
  const progressColor = getProgressColor(progress);

  return (
    <PeriodDetailScreen
      kind="day"
      title="Today"
      progress={progress}
      passedLabel={<LiveDayLabel type="passed" />}
      leftLabel={<LiveDayLabel type="left" color={progressColor} />}
      passedCaption="PASSED"
      leftCaption="LEFT"
      summary={`${pctDone}% of the day passed · ${pctLeft}% left`}
      liveHint="Updates every second"
      footer={
        <TouchableOpacity
          style={styles.cta}
          onPress={() => {
            if (goalsFeatureEnabled) {
              navigation.navigate('DailyTasks');
            } else {
              Alert.alert(
                'Coming soon',
                'Daily tasks will be available in a future update.',
              );
            }
          }}
        >
          <Text variant="sectionTitle" color="primary">
            Today&apos;s tasks
          </Text>
          <Text variant="caption" color="secondary">
            Add and tick off your daily tasks →
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
  bigValue: {
    fontSize: Typography.display,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
});
