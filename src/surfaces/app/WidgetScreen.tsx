import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, NativeModules, Platform } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, ScreenGradient, Card } from '../../ui';
import { Colors, Spacing } from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';

const { WidgetBridge } = NativeModules;

export type WidgetStatus = {
  dayWidgetAdded: boolean;
  monthWidgetAdded: boolean;
  yearWidgetAdded: boolean;
  counterWidgetAdded: boolean;
  countdownWidgetAdded: boolean;
} | null;

const WIDGETS: { key: keyof NonNullable<WidgetStatus>; title: string; description: string }[] = [
  {
    key: 'dayWidgetAdded',
    title: 'Today',
    description: 'Day progress with hours and minutes. Small, medium, and large sizes.',
  },
  {
    key: 'monthWidgetAdded',
    title: 'This month',
    description: 'Month progress with 12 dots and days passed/left. Medium size.',
  },
  {
    key: 'yearWidgetAdded',
    title: 'This year',
    description: 'Year progress with 365 dots and days passed/left. Large size.',
  },
  {
    key: 'counterWidgetAdded',
    title: 'Counter',
    description: 'Tap to add +1. Create counters (e.g. Water) in Custom counters, then add this widget.',
  },
  {
    key: 'countdownWidgetAdded',
    title: 'Countdown',
    description: 'Shows days left until a deadline. Add deadlines (e.g. Project, Interview) in Countdowns.',
  },
];

export function WidgetScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Widget'>>();
  const [status, setStatus] = useState<WidgetStatus>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(() => {
    if (!WidgetBridge?.getWidgetStatus) {
      setStatus({ dayWidgetAdded: false, monthWidgetAdded: false, yearWidgetAdded: false, counterWidgetAdded: false, countdownWidgetAdded: false });
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

  useFocusEffect(
    useCallback(() => {
      fetchStatus();
    }, [fetchStatus])
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

          {!loading && status && WIDGETS.map(({ key, title, description }) => {
            const added = status[key];
            return (
              <Card key={key} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text variant="title" color="primary" style={styles.widgetTitle}>
                    {title}
                  </Text>
                  <View style={[styles.badge, added ? styles.badgeAdded : styles.badgeNotAdded]}>
                    <Text variant="caption" style={styles.badgeText}>
                      {added ? 'On home screen' : 'Not added'}
                    </Text>
                  </View>
                </View>
                <Text variant="body" color="secondary" style={styles.description}>
                  {description}
                </Text>
              </Card>
            );
          })}

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
  hint: {
    marginTop: Spacing[4],
    fontStyle: 'italic',
  },
});