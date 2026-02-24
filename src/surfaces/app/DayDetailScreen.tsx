import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, ScreenGradient, Card, ProgressLine, CircularProgress } from '../../ui';
import { useObserveTimeState } from '../../hooks';
import { getDayProgress } from '../../core/time/day';
import { startOfDay, endOfDay } from '../../core/time/clock';
import { Spacing, Colors, getProgressColor } from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';

const RING_SIZE = Math.min(220, Dimensions.get('window').width - Spacing[4] * 2 - 32);

function formatTime(date: Date) {
  const start = startOfDay(date).getTime();
  const end = endOfDay(date).getTime();
  const passedMs = date.getTime() - start;
  const remainingMs = Math.max(0, end - date.getTime());
  const passedS = Math.floor(passedMs / 1000);
  const remainingS = Math.floor(remainingMs / 1000);
  const h = (n: number) => Math.floor(n / 3600);
  const m = (n: number) => Math.floor((n % 3600) / 60);
  const s = (n: number) => n % 60;
  return {
    passed: `${h(passedS)}h ${m(passedS)}m ${s(passedS)}s`,
    left: `${h(remainingS)}h ${m(remainingS)}m ${s(remainingS)}s`,
    progress: getDayProgress(date).progress,
  };
}

export function DayDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'DayDetail'>>();
  const [live, setLive] = useState(() => new Date());
  const { timeState } = useObserveTimeState();

  useEffect(() => {
    const t = setInterval(() => setLive(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { passed, left, progress } = formatTime(live);
  const progressColor = getProgressColor(progress);
  const pctDone = Math.round(progress * 100);
  const pctLeft = 100 - pctDone;

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text variant="sectionTitle" color="secondary" style={styles.overhead}>
            Today
          </Text>

          <View style={styles.ringWrap}>
            <CircularProgress
              progress={progress}
              size={RING_SIZE}
              strokeWidth={14}
              label={`${pctDone}%`}
            />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text variant="caption" color="secondary" style={styles.statLabel}>
                PASSED
              </Text>
              <Text variant="title" color="primary" style={styles.passedValue}>
                {passed}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text variant="caption" color="secondary" style={styles.statLabel}>
                LEFT
              </Text>
              <Text variant="title" color="primary" style={[styles.leftValue, { color: progressColor }]}>
                {left}
              </Text>
            </View>
          </View>

          <Card style={styles.card}>
            <View style={styles.percentRow}>
              <Text variant="body" color="secondary">
                {pctDone}% of the day passed · {pctLeft}% left
              </Text>
            </View>
            <ProgressLine progress={progress} fillColor={progressColor} style={styles.progress} />
          </Card>

          <TouchableOpacity
            style={styles.cta}
            onPress={() => navigation.navigate('DailyTasks')}
          >
            <Text variant="sectionTitle" color="primary">
              Today&apos;s tasks
            </Text>
            <Text variant="caption" color="secondary">
              Add and tick off your daily tasks →
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[7],
  },
  overhead: {
    textAlign: 'center',
    marginBottom: Spacing[4],
    letterSpacing: 1.2,
  },
  ringWrap: {
    alignItems: 'center',
    marginBottom: Spacing[5],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing[4],
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    letterSpacing: 0.8,
    marginBottom: 4,
    fontSize: 11,
  },
  passedValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  leftValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  card: {
    marginBottom: Spacing[4],
  },
  percentRow: {
    marginBottom: Spacing[2],
  },
  progress: {
    marginTop: Spacing[1],
  },
  cta: {
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
    backgroundColor: Colors.cardLighter,
    borderRadius: 16,
  },
});
