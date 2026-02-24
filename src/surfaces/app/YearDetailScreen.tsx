import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, ScreenGradient, Card, ProgressLine, CircularProgress } from '../../ui';
import { useObserveTimeState } from '../../hooks';
import { Spacing, Colors, getProgressColor } from '../../theme';

function getDaysInYear(): number {
  const y = new Date().getFullYear();
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365;
}

const RING_SIZE = Math.min(200, Dimensions.get('window').width - Spacing[4] * 2 - 32);

export function YearDetailScreen() {
  const { timeState } = useObserveTimeState();

  const remainingDaysYear = timeState.remainingDaysYear ?? 0;
  const daysInYear = getDaysInYear();
  const passedDays = daysInYear - remainingDaysYear;
  const progress = timeState.year ?? 0;
  const progressColor = getProgressColor(progress);
  const pct = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text variant="sectionTitle" color="secondary" style={styles.overhead}>
            This year
          </Text>

          <View style={styles.ringWrap}>
            <CircularProgress
              progress={progress}
              size={RING_SIZE}
              strokeWidth={12}
              label={`${pct}%`}
            />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text variant="caption" color="secondary" style={styles.statLabel}>
                DAYS PASSED
              </Text>
              <Text variant="title" color="primary" style={styles.bigValue}>
                {passedDays}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text variant="caption" color="secondary" style={styles.statLabel}>
                DAYS LEFT
              </Text>
              <Text variant="title" color="primary" style={[styles.bigValue, { color: progressColor }]}>
                {remainingDaysYear}
              </Text>
            </View>
          </View>

          <Card style={styles.card}>
            <Text variant="body" color="secondary" style={styles.cardText}>
              {passedDays} of {daysInYear} days · {100 - pct}% of year remaining
            </Text>
            <ProgressLine progress={progress} fillColor={progressColor} style={styles.progress} />
          </Card>

          <View style={styles.dotsHint}>
            <Text variant="caption" color="secondary">
              The Year widget shows all 365 days at a glance. Add it from Widgets.
            </Text>
          </View>
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
  bigValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  card: {
    marginBottom: Spacing[4],
  },
  cardText: {
    marginBottom: Spacing[2],
  },
  progress: {
    marginTop: Spacing[1],
  },
  dotsHint: {
    paddingHorizontal: Spacing[2],
  },
});
