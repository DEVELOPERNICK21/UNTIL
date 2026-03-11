import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, NativeModules, Platform } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { isOverlayEnabled } from '../../infrastructure';
import { useObserveSubscription } from '../../hooks';
import { isPremiumWidget } from '../../domain/premium';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, ScreenGradient, Card } from '../../ui';
import { Colors, Spacing } from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';

const { WidgetBridge, LiveActivityBridge } = NativeModules;

function useOverlayStatus() {
  const [active, setActive] = useState(false);
  useFocusEffect(useCallback(() => {
    if (Platform.OS === 'android') setActive(isOverlayEnabled());
  }, []));
  return active;
}

export type WidgetStatus = {
  dayWidgetAdded: boolean;
  monthWidgetAdded: boolean;
  yearWidgetAdded: boolean;
  counterWidgetAdded: boolean;
  countdownWidgetAdded: boolean;
  dailyTasksWidgetAdded?: boolean;
  hourCalculationWidgetAdded?: boolean;
} | null;

const WIDGETS: { key: keyof NonNullable<WidgetStatus>; kind: 'day' | 'month' | 'year' | 'counter' | 'countdown' | 'dailyTasks' | 'hourCalc'; title: string; description: string }[] = [
  {
    key: 'dayWidgetAdded',
    kind: 'day',
    title: 'Today',
    description: 'Day progress with hours and minutes. Small, medium, and large sizes.',
  },
  {
    key: 'monthWidgetAdded',
    kind: 'month',
    title: 'This month',
    description: 'Month progress with 12 dots and days passed/left. Medium size.',
  },
  {
    key: 'yearWidgetAdded',
    kind: 'year',
    title: 'This year',
    description: 'Year progress with 365 dots and days passed/left. Large size.',
  },
  {
    key: 'counterWidgetAdded',
    kind: 'counter',
    title: 'Counter',
    description: 'Tap to add +1. Create counters (e.g. Water) in Custom counters, then add this widget.',
  },
  {
    key: 'countdownWidgetAdded',
    kind: 'countdown',
    title: 'Countdown',
    description: 'Shows days left until a deadline. Add deadlines (e.g. Project, Interview) in Countdowns.',
  },
  {
    key: 'dailyTasksWidgetAdded',
    kind: 'dailyTasks',
    title: 'Daily tasks',
    description: "Today's task report: completed vs pending. Add tasks in Today's tasks.",
  },
  {
    key: 'hourCalculationWidgetAdded',
    kind: 'hourCalc',
    title: 'Hour calculation',
    description: 'Tap to start/stop. One timer. Set title (e.g. Office hour) in Until.',
  },
];

export function WidgetScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Widget'>>();
  const { isPremium } = useObserveSubscription();
  const [status, setStatus] = useState<WidgetStatus>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveActivityActive, setLiveActivityActive] = useState(false);
  const overlayActive = useOverlayStatus();

  const fetchStatus = useCallback(() => {
    if (!WidgetBridge?.getWidgetStatus) {
        setStatus({
          dayWidgetAdded: false,
          monthWidgetAdded: false,
          yearWidgetAdded: false,
          counterWidgetAdded: false,
          countdownWidgetAdded: false,
          dailyTasksWidgetAdded: false,
          hourCalculationWidgetAdded: false,
        });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    WidgetBridge.getWidgetStatus()
      .then((result: WidgetStatus) => {
        setStatus(result ?? null);
        setLoading(false);
      })
      .catch((err: { message?: string }) => {
        setError(err?.message ?? 'Could not load widget status');
        setStatus(null);
        setLoading(false);
      });
  }, []);

  const refreshLiveActivityStatus = useCallback(() => {
    if (Platform.OS === 'ios' && LiveActivityBridge?.isActivityActive) {
      LiveActivityBridge.isActivityActive()
        .then((active: boolean) => setLiveActivityActive(active))
        .catch(() => setLiveActivityActive(false));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStatus();
      refreshLiveActivityStatus();
    }, [fetchStatus, refreshLiveActivityStatus])
  );

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text variant="sectionTitle" color="primary" style={styles.title}>
            Widgets
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Add Until widgets to your home screen to see time at a glance. Data updates when you open the app.
          </Text>

          {loading && (
            <Text variant="caption" color="secondary" style={styles.statusText}>
              Checking…
            </Text>
          )}
          {error && (
            <Text variant="caption" style={[styles.statusText, { color: Colors.textSecondary }]}>
              {error}
            </Text>
          )}

          {!loading && status && WIDGETS.map(({ key, kind, title, description }) => {
            const added = status[key];
            const locked = isPremiumWidget(kind) && !isPremium;
            return (
              <Card key={key} style={locked ? styles.cardLocked : undefined}>
                <View style={styles.cardHeader}>
                  <Text variant="title" color="primary" style={styles.widgetTitle}>
                    {title}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {locked && (
                      <View style={styles.premiumBadge}>
                        <Text variant="caption" style={styles.premiumBadgeText}>Premium</Text>
                      </View>
                    )}
                    <View style={[styles.badge, added ? styles.badgeAdded : styles.badgeNotAdded]}>
                      <Text variant="caption" style={styles.badgeText}>
                        {added ? 'On home screen' : 'Not added'}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text variant="body" color="secondary" style={styles.description}>
                  {locked ? 'Upgrade to Premium to add this widget.' : description}
                </Text>
              </Card>
            );
          })}

          {Platform.OS === 'ios' && (
            <TouchableOpacity onPress={() => navigation.navigate('DynamicIsland')} activeOpacity={0.8}>
              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text variant="title" color="primary" style={styles.widgetTitle}>
                    Dynamic Island
                  </Text>
                  <View style={[styles.badge, liveActivityActive ? styles.badgeAdded : styles.badgeNotAdded]}>
                    <Text variant="caption" style={styles.badgeText}>
                      {liveActivityActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                <Text variant="body" color="secondary" style={styles.description}>
                  Live Activity in Dynamic Island and Lock Screen. Tap to configure.
                </Text>
              </Card>
            </TouchableOpacity>
          )}
          {Platform.OS === 'android' && (
            <TouchableOpacity onPress={() => navigation.navigate('Overlay')} activeOpacity={0.8}>
              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text variant="title" color="primary" style={styles.widgetTitle}>
                    Floating overlay
                  </Text>
                  <View style={[styles.badge, overlayActive ? styles.badgeAdded : styles.badgeNotAdded]}>
                    <Text variant="caption" style={styles.badgeText}>
                      {overlayActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                <Text variant="body" color="secondary" style={styles.description}>
                  Dynamic Island–like pill over other apps. Tap to expand, drag to move.
                </Text>
              </Card>
            </TouchableOpacity>
          )}

          {!loading && status && (
            <>
              <TouchableOpacity
                style={styles.customLink}
                onPress={() => navigation.navigate('CustomCounters')}
              >
                <Text variant="body" color="primary">Custom counters</Text>
                <Text variant="caption" color="secondary">Add tap-to-increment widgets (e.g. Water)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.customLink}
                onPress={() => navigation.navigate('Countdowns')}
              >
                <Text variant="body" color="primary">Countdowns</Text>
                <Text variant="caption" color="secondary">Deadline countdown (e.g. Project, Interview)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.customLink}
                onPress={() => navigation.navigate('DailyTasks')}
              >
                <Text variant="body" color="primary">Today&apos;s tasks</Text>
                <Text variant="caption" color="secondary">Daily task list and day report</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.customLink}
                onPress={() => navigation.navigate('HourCalculation')}
              >
                <Text variant="body" color="primary">Hour calculation</Text>
                <Text variant="caption" color="secondary">Tap widget to start/stop. One timer. Set title in app.</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.customLink}
                onPress={() => navigation.navigate('TaskReport')}
              >
                <Text variant="body" color="primary">Task report</Text>
                <Text variant="caption" color="secondary">Daily, weekly & monthly charts</Text>
              </TouchableOpacity>
              <Text variant="caption" color="secondary" style={styles.hint}>
                {Platform.OS === 'ios'
                  ? 'Long-press the home screen, tap +, then search for Until to add a widget.'
                  : 'Long-press the home screen and tap Widgets to add an Until widget.'}
              </Text>
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
    paddingBottom: Spacing[5],
  },
  title: {
    marginBottom: Spacing[2],
  },
  subtitle: {
    marginBottom: Spacing[4],
  },
  statusText: {
    marginBottom: Spacing[3],
  },
  card: {
    marginBottom: Spacing[3],
  },
  cardLocked: {
    opacity: 0.7,
  },
  premiumBadge: {
    backgroundColor: Colors.percent,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumBadgeText: {
    color: Colors.background,
    fontSize: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  widgetTitle: {
    flex: 1,
  },
  badge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: 6,
  },
  badgeAdded: {
    backgroundColor: Colors.divider,
  },
  badgeNotAdded: {
    backgroundColor: Colors.cardLighter,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  badgeText: {
    color: Colors.textPrimary,
    fontSize: 11,
  },
  description: {
    marginTop: 0,
  },
  customLink: {
    marginTop: Spacing[3],
    marginBottom: Spacing[2],
    paddingVertical: Spacing[2],
  },
  liveActivityActions: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: Spacing[2],
  },
  liveActivityButton: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    backgroundColor: Colors.divider,
    borderRadius: 8,
  },
  liveActivityButtonDisabled: {
    opacity: 0.5,
  },
  hint: {
    marginTop: Spacing[4],
    fontStyle: 'italic',
  },
});