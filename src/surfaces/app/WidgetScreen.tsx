import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  NativeModules,
  Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { isOverlayEnabled } from '../../infrastructure';
import { useObserveSubscription } from '../../hooks';
import { isPremiumWidget } from '../../domain/premium';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, ScreenGradient } from '../../ui';
import { Colors, Spacing, Radius, Typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';

const { WidgetBridge, LiveActivityBridge } = NativeModules;

function useOverlayStatus() {
  const [active, setActive] = useState(false);
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') setActive(isOverlayEnabled());
    }, []),
  );
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

const WIDGETS: {
  key: keyof NonNullable<WidgetStatus>;
  kind:
    | 'day'
    | 'month'
    | 'year'
    | 'counter'
    | 'countdown'
    | 'dailyTasks'
    | 'hourCalc';
  title: string;
  description: string;
}[] = [
  {
    key: 'dayWidgetAdded',
    kind: 'day',
    title: 'Today',
    description:
      'Day progress with hours and minutes. Small, medium, and large sizes.',
  },
  {
    key: 'monthWidgetAdded',
    kind: 'month',
    title: 'This month',
    description:
      'Month progress with 12 dots and days passed/left. Medium size.',
  },
  {
    key: 'yearWidgetAdded',
    kind: 'year',
    title: 'This year',
    description:
      'Year progress with 365 dots and days passed/left. Large size.',
  },
  {
    key: 'counterWidgetAdded',
    kind: 'counter',
    title: 'Counter',
    description:
      'Tap to add +1. Create counters in Custom counters, then add this widget.',
  },
  {
    key: 'countdownWidgetAdded',
    kind: 'countdown',
    title: 'Countdown',
    description:
      'Shows days left until a deadline. Add deadlines in Countdowns.',
  },
  {
    key: 'dailyTasksWidgetAdded',
    kind: 'dailyTasks',
    title: 'Daily tasks',
    description:
      "Today's task report: completed vs pending. Add tasks in Today's tasks.",
  },
  {
    key: 'hourCalculationWidgetAdded',
    kind: 'hourCalc',
    title: 'Hour calculation',
    description:
      'Tap to start/stop. One timer. Set title (e.g. Office hour) in Until.',
  },
];

function SectionHeader({ label }: { label: string }) {
  return (
    <Text variant="caption" color="secondary" style={styles.sectionLabel}>
      {label.toUpperCase()}
    </Text>
  );
}

function GlassSection({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  return <View style={[styles.glassSection, style]}>{children}</View>;
}

interface SettingTileProps {
  title: string;
  description: string;
  status?: 'on' | 'off' | 'active' | 'inactive';
  statusLabel?: string;
  locked?: boolean;
  onPress?: () => void;
  children?: React.ReactNode;
}

function SettingTile({
  title,
  description,
  status,
  statusLabel,
  locked,
  onPress,
  children,
}: SettingTileProps) {
  const content = (
    <View style={styles.tileInner}>
      <View style={styles.tileMain}>
        <Text
          variant="title"
          color="primary"
          style={styles.tileTitle}
          numberOfLines={1}
        >
          {title}
        </Text>
        {status !== undefined && statusLabel !== undefined && (
          <View
            style={[
              styles.statusPill,
              status === 'on' || status === 'active'
                ? styles.statusPillOn
                : styles.statusPillOff,
            ]}
          >
            <Text variant="caption" style={styles.statusPillText}>
              {statusLabel}
            </Text>
          </View>
        )}
        {locked && (
          <View style={styles.premiumPill}>
            <Text variant="caption" style={styles.premiumPillText}>
              Premium
            </Text>
          </View>
        )}
      </View>
      <Text
        variant="body"
        color="secondary"
        style={styles.tileDescription}
        numberOfLines={2}
      >
        {locked ? 'Upgrade to Premium to add this widget.' : description}
      </Text>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={styles.tileWrapper}
      >
        <View style={[styles.glassTile, locked && styles.tileLocked]}>
          {content}
          <Text variant="caption" color="secondary" style={styles.tileChevron}>
            Open →
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
  return (
    <View style={[styles.glassTile, locked && styles.tileLocked]}>
      {content}
    </View>
  );
}

function QuickLinkTile({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.quickLinkTouch}
    >
      <View style={styles.quickLinkTile}>
        <View>
          <Text variant="body" color="primary" style={styles.quickLinkTitle}>
            {title}
          </Text>
          <Text variant="caption" color="secondary">
            {subtitle}
          </Text>
        </View>
        <Text variant="caption" color="secondary">
          →
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function WidgetScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Widget'>>();
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
    }, [fetchStatus, refreshLiveActivityStatus]),
  );

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text variant="sectionTitle" color="primary" style={styles.title}>
            Settings
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Widgets, Dynamic Island, and floating overlay. Add home screen
            widgets and configure what appears in Dynamic Island or overlay.
          </Text>

          {loading && (
            <Text variant="caption" color="secondary" style={styles.statusText}>
              Checking…
            </Text>
          )}
          {error && (
            <Text
              variant="caption"
              style={[styles.statusText, { color: Colors.textSecondary }]}
            >
              {error}
            </Text>
          )}

          {/* Section: Home screen widgets */}
          {!loading && status && (
            <>
              <SectionHeader label="Home screen widgets" />
              <GlassSection style={styles.sectionSpacing}>
                {WIDGETS.map(({ key, kind, title, description }) => {
                  const added = status[key];
                  const locked = isPremiumWidget(kind) && !isPremium;
                  return (
                    <SettingTile
                      key={key}
                      title={title}
                      description={description}
                      status={added ? 'on' : 'off'}
                      statusLabel={added ? 'On home screen' : 'Not added'}
                      locked={locked}
                    />
                  );
                })}
              </GlassSection>
            </>
          )}

          {/* Section: Always visible (Dynamic Island / Floating overlay) */}
          <SectionHeader label="Always visible" />
          <GlassSection style={styles.sectionSpacing}>
            {Platform.OS === 'ios' && (
              <SettingTile
                title="Dynamic Island"
                description="Live Activity in Dynamic Island and Lock Screen. Tap to configure."
                status={liveActivityActive ? 'active' : 'inactive'}
                statusLabel={liveActivityActive ? 'Active' : 'Inactive'}
                onPress={() => navigation.navigate('DynamicIsland')}
              />
            )}
            {Platform.OS === 'android' && (
              <SettingTile
                title="Floating overlay"
                description="Dynamic Island–like pill over other apps. Tap to expand, drag to move."
                status={overlayActive ? 'active' : 'inactive'}
                statusLabel={overlayActive ? 'Active' : 'Inactive'}
                onPress={() => navigation.navigate('Overlay')}
              />
            )}
          </GlassSection>

          {/* Section: Quick links */}
          <SectionHeader label="Manage data & features" />
          <GlassSection style={styles.sectionSpacing}>
            <QuickLinkTile
              title="Custom counters"
              subtitle="Tap-to-increment widgets (e.g. Water)"
              onPress={() => navigation.navigate('CustomCounters')}
            />
            <QuickLinkTile
              title="Countdowns"
              subtitle="Deadline countdown (e.g. Project, Interview)"
              onPress={() => navigation.navigate('Countdowns')}
            />
            <QuickLinkTile
              title="Today's tasks"
              subtitle="Daily task list and day report"
              onPress={() => navigation.navigate('DailyTasks')}
            />
            <QuickLinkTile
              title="Hour calculation"
              subtitle="Tap widget to start/stop. Set title in app."
              onPress={() => navigation.navigate('HourCalculation')}
            />
            <QuickLinkTile
              title="Task report"
              subtitle="Daily, weekly & monthly charts"
              onPress={() => navigation.navigate('TaskReport')}
            />
          </GlassSection>

          <Text variant="caption" color="secondary" style={styles.hint}>
            {Platform.OS === 'ios'
              ? 'Long-press the home screen, tap +, then search for Until to add a widget.'
              : 'Long-press the home screen and tap Widgets to add an Until widget.'}
          </Text>
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
  title: { marginBottom: Spacing[2] },
  subtitle: { marginBottom: Spacing[4] },
  statusText: { marginBottom: Spacing[3] },

  sectionLabel: {
    letterSpacing: 1.2,
    marginBottom: Spacing[2],
    marginTop: Spacing[2],
  },
  glassSection: {
    backgroundColor: Colors.glassBg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
    padding: Spacing[2],
    gap: Spacing[2],
  },
  sectionSpacing: {
    marginBottom: Spacing[2],
  },

  tileWrapper: {
    marginBottom: Spacing[2],
  },
  glassTile: {
    backgroundColor: Colors.glassHighlight,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: Spacing[3],
  },
  tileLocked: {
    opacity: 0.75,
  },
  tileInner: {},
  tileMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing[2],
    marginBottom: Spacing[1],
  },
  tileTitle: {
    flex: 1,
    fontSize: Typography.lead,
  },
  tileDescription: {
    marginTop: 2,
  },
  tileChevron: {
    marginTop: Spacing[2],
    alignSelf: 'flex-end',
  },
  statusPill: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusPillOn: {
    backgroundColor: 'rgba(34, 170, 34, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(34, 170, 34, 0.4)',
  },
  statusPillOff: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  statusPillText: {
    color: Colors.textPrimary,
    fontSize: Typography.badge,
  },
  premiumPill: {
    backgroundColor: Colors.percent,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumPillText: {
    color: Colors.background,
    fontSize: Typography.micro,
  },

  quickLinkTouch: {
    marginBottom: Spacing[1],
  },
  quickLinkTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.glassHighlight,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
  },
  quickLinkTitle: {
    marginBottom: 2,
  },

  hint: {
    marginTop: Spacing[4],
    fontStyle: 'italic',
  },
});
