import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getDailyTaskStatsUseCase,
  getWeeklyTaskStatsUseCase,
  getMonthlyTaskStatsUseCase,
} from '../../di';
import {
  Text,
  ScreenGradient,
  Card,
  PieChart,
  BarChart,
  type PieSegment,
  type BarDataPoint,
} from '../../ui';
import { Spacing, Colors, Typography } from '../../theme';
import type { TaskCategory } from '../../types';

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  health: 'Health',
  work: 'Work',
  personal_care: 'Personal care',
  learning: 'Learning',
  other: 'Other',
};

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  health: '#34C759',
  work: '#BB86FC',
  personal_care: '#E9A23A',
  learning: '#0A84FF',
  other: '#8E8E93',
};

const CHART_SIZE = Math.min(200, Dimensions.get('window').width - Spacing[4] * 2 - 32);
const BAR_CHART_WIDTH = Dimensions.get('window').width - Spacing[4] * 2 - 8;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function shortDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'Z');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[d.getUTCDay()] ?? dateStr.slice(5);
}

type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export function TaskReportScreen() {
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((k) => k + 1);
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 400);
  }, []);

  const today = todayIso();
  const now = new Date();

  const dailyStats = useMemo(
    () => getDailyTaskStatsUseCase.execute(today),
    [today, refreshKey]
  );
  const weeklyStats = useMemo(
    () => getWeeklyTaskStatsUseCase.execute(now),
    [refreshKey]
  );
  const monthlyStats = useMemo(
    () => getMonthlyTaskStatsUseCase.execute(now.getFullYear(), now.getMonth() + 1),
    [now.getFullYear(), now.getMonth(), refreshKey]
  );

  const dailyPieData: PieSegment[] = useMemo(() => {
    if (dailyStats.total === 0) return [{ value: 1, color: Colors.divider }];
    const segments: PieSegment[] = [];
    if (dailyStats.completed > 0) segments.push({ value: dailyStats.completed, color: '#34C759', label: 'Done' });
    if (dailyStats.pending > 0) segments.push({ value: dailyStats.pending, color: '#E9A23A', label: 'Pending' });
    return segments.length ? segments : [{ value: 1, color: Colors.divider }];
  }, [dailyStats]);

  const dailyCategoryPie: PieSegment[] = useMemo(() => {
    const entries = Object.entries(dailyStats.byCategory);
    if (entries.length === 0) return [{ value: 1, color: Colors.divider }];
    return entries.map(([cat, s]) => ({
      value: s.total,
      color: CATEGORY_COLORS[cat as TaskCategory] ?? Colors.divider,
      label: CATEGORY_LABELS[cat as TaskCategory],
    }));
  }, [dailyStats.byCategory]);

  const weeklyBarData: BarDataPoint[] = useMemo(
    () =>
      weeklyStats.byDay.map((d) => ({
        label: shortDayLabel(d.date),
        value: d.completed,
        value2: d.total - d.completed,
      })),
    [weeklyStats.byDay]
  );

  const weeklyCategoryPie: PieSegment[] = useMemo(() => {
    const entries = Object.entries(weeklyStats.byCategory);
    if (entries.length === 0) return [{ value: 1, color: Colors.divider }];
    return entries.map(([cat, s]) => ({
      value: s.total,
      color: CATEGORY_COLORS[cat as TaskCategory] ?? Colors.divider,
      label: CATEGORY_LABELS[cat as TaskCategory],
    }));
  }, [weeklyStats.byCategory]);

  const monthlyBarData: BarDataPoint[] = useMemo(() => {
    const byWeek: BarDataPoint[] = [];
    const days = monthlyStats.byDay;
    for (let w = 0; w < Math.ceil(days.length / 7); w++) {
      const weekDays = days.slice(w * 7, (w + 1) * 7);
      const completed = weekDays.reduce((s, d) => s + d.completed, 0);
      const total = weekDays.reduce((s, d) => s + d.total, 0);
      byWeek.push({
        label: `W${w + 1}`,
        value: completed,
        value2: total - completed,
      });
    }
    return byWeek.length ? byWeek : [{ label: '—', value: 0 }];
  }, [monthlyStats.byDay]);

  const monthlyCategoryPie: PieSegment[] = useMemo(() => {
    const entries = Object.entries(monthlyStats.byCategory);
    if (entries.length === 0) return [{ value: 1, color: Colors.divider }];
    return entries.map(([cat, s]) => ({
      value: s.total,
      color: CATEGORY_COLORS[cat as TaskCategory] ?? Colors.divider,
      label: CATEGORY_LABELS[cat as TaskCategory],
    }));
  }, [monthlyStats.byCategory]);

  const stats =
    period === 'daily'
      ? dailyStats
      : period === 'weekly'
        ? weeklyStats
        : monthlyStats;
  const completionPct =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.textSecondary}
            />
          }
        >
          <Text variant="large" color="primary" style={styles.title}>
            Task report
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Completion and status by day, week, and month.
          </Text>

          <View style={styles.segmented}>
            {(['daily', 'weekly', 'monthly'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.segment, period === p && styles.segmentActive]}
                onPress={() => setPeriod(p)}
                activeOpacity={0.7}
              >
                <Text
                  variant="sectionTitle"
                  color={period === p ? 'primary' : 'secondary'}
                  style={styles.segmentLabel}
                >
                  {p === 'daily' ? 'Daily' : p === 'weekly' ? 'Weekly' : 'Monthly'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Card style={styles.statsCard}>
            <View style={styles.statsGrid}>
              <View style={styles.statBlock}>
                <Text variant="caption" color="secondary" style={styles.statLabel}>
                  COMPLETED
                </Text>
                <Text variant="title" color="primary" style={styles.statValue}>
                  {stats.completed}
                </Text>
              </View>
              <View style={styles.statBlock}>
                <Text variant="caption" color="secondary" style={styles.statLabel}>
                  PENDING
                </Text>
                <Text variant="title" color="primary" style={styles.statValue}>
                  {stats.pending}
                </Text>
              </View>
              <View style={styles.statBlock}>
                <Text variant="caption" color="secondary" style={styles.statLabel}>
                  COMPLETION
                </Text>
                <Text variant="title" color="primary" style={[styles.statValue, { color: completionPct === 100 ? '#34C759' : Colors.textPrimary }]}>
                  {stats.total > 0 ? `${completionPct}%` : '—'}
                </Text>
              </View>
            </View>
          </Card>

          {period === 'daily' && (
            <>
              <Card style={styles.card}>
                <Text variant="sectionTitle" color="secondary" style={styles.cardTitle}>
                  Today · Status
                </Text>
                <View style={styles.chartSection}>
                  <PieChart
                    data={dailyPieData}
                    size={CHART_SIZE}
                    strokeWidth={1}
                    innerRadiusPercent={58}
                    showLegend
                    segmentGap={0.8}
                  />
                </View>
                {dailyCategoryPie.length > 1 && (
                  <>
                    <Text variant="sectionTitle" color="secondary" style={styles.categoryTitle}>
                      By category
                    </Text>
                    <View style={styles.chartSection}>
                      <PieChart
                        data={dailyCategoryPie}
                        size={CHART_SIZE}
                        strokeWidth={1}
                        innerRadiusPercent={58}
                        showLegend
                        segmentGap={0.8}
                      />
                    </View>
                  </>
                )}
              </Card>
            </>
          )}

          {period === 'weekly' && (
            <>
              <Card style={styles.card}>
                <Text variant="sectionTitle" color="secondary" style={styles.cardTitle}>
                  Last 7 days
                </Text>
                <BarChart
                  data={weeklyBarData}
                  width={BAR_CHART_WIDTH}
                  barColor="#34C759"
                  barColor2="#E9A23A"
                  showLegend
                />
                {weeklyCategoryPie.length > 1 && (
                  <>
                    <Text variant="sectionTitle" color="secondary" style={styles.categoryTitle}>
                      By category
                    </Text>
                    <View style={styles.chartSection}>
                      <PieChart
                        data={weeklyCategoryPie}
                        size={CHART_SIZE}
                        strokeWidth={1}
                        innerRadiusPercent={58}
                        showLegend
                        segmentGap={0.8}
                      />
                    </View>
                  </>
                )}
              </Card>
            </>
          )}

          {period === 'monthly' && (
            <>
              <Card style={styles.card}>
                <Text variant="sectionTitle" color="secondary" style={styles.cardTitle}>
                  This month by week
                </Text>
                <BarChart
                  data={monthlyBarData}
                  width={BAR_CHART_WIDTH}
                  barColor="#34C759"
                  barColor2="#E9A23A"
                  showLegend
                />
                {monthlyCategoryPie.length > 1 && (
                  <>
                    <Text variant="sectionTitle" color="secondary" style={styles.categoryTitle}>
                      By category
                    </Text>
                    <View style={styles.chartSection}>
                      <PieChart
                        data={monthlyCategoryPie}
                        size={CHART_SIZE}
                        strokeWidth={1}
                        innerRadiusPercent={58}
                        showLegend
                        segmentGap={0.8}
                      />
                    </View>
                  </>
                )}
              </Card>
            </>
          )}
        </ScrollView>
      </ScreenGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[7],
  },
  title: {
    marginBottom: Spacing[1],
    fontWeight: '600',
  },
  subtitle: {
    marginBottom: Spacing[4],
  },
  segmented: {
    flexDirection: 'row',
    marginBottom: Spacing[4],
    backgroundColor: Colors.divider,
    borderRadius: 12,
    padding: 5,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentActive: {
    backgroundColor: Colors.cardLighter,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentLabel: {
    fontSize: Typography.sectionTitle,
  },
  statsCard: {
    marginBottom: Spacing[4],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBlock: {
    alignItems: 'center',
  },
  statLabel: {
    letterSpacing: 0.8,
    marginBottom: 4,
    fontSize: 11,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
  },
  card: {
    marginBottom: Spacing[4],
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[3],
  },
  cardTitle: {
    marginBottom: Spacing[3],
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 12,
  },
  categoryTitle: {
    marginTop: Spacing[4],
    marginBottom: Spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 12,
  },
  chartSection: {
    alignItems: 'center',
    marginTop: Spacing[2],
  },
});
