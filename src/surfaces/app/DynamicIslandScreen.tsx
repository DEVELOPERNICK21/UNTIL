/**
 * Dedicated Dynamic Island / Live Activity screen
 * Configure widget type (Day, Month, Year, Life, Daily Task, Hour Calc) and start/stop
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, NativeModules, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Text, ScreenGradient, Card } from '../../ui';
import { Colors, Spacing, Typography } from '../../theme';
import { useObserveSubscription } from '../../hooks';
import { isPremiumLiveActivityType } from '../../domain/premium';
import {
  syncLiveActivity,
  endLiveActivity,
  getLiveActivityWidgetType,
  setLiveActivityWidgetType,
  updateLiveActivity,
} from '../../infrastructure';
import type { LiveActivityWidgetType } from '../../infrastructure';

const { LiveActivityBridge } = NativeModules;

const WIDGET_OPTIONS: { type: LiveActivityWidgetType; title: string; description: string }[] = [
  { type: 'day', title: 'Today', description: '57% done · 42% left. Day progress with hours.' },
  { type: 'month', title: 'This month', description: 'Feb 17% · 23d left. Month progress.' },
  { type: 'year', title: 'This year', description: '9% · 329d left. Year progress.' },
  { type: 'life', title: 'Your life', description: 'Life progress. Set birth date in Settings.' },
  { type: 'dailyTasks', title: 'Daily tasks', description: '3/5 done. Today\'s task report.' },
  { type: 'hourCalc', title: 'Hour timer', description: '0:12:34. Tap to start/stop.' },
];

export function DynamicIslandScreen() {
  const { isPremium } = useObserveSubscription();
  const [activeWidget, setActiveWidget] = useState<LiveActivityWidgetType>(getLiveActivityWidgetType());
  const [liveActivityActive, setLiveActivityActive] = useState(false);

  const refreshStatus = useCallback(() => {
    if (Platform.OS === 'ios' && LiveActivityBridge?.isActivityActive) {
      LiveActivityBridge.isActivityActive()
        .then((active: boolean) => setLiveActivityActive(active))
        .catch(() => setLiveActivityActive(false));
    }
    setActiveWidget(getLiveActivityWidgetType());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshStatus();
    }, [refreshStatus])
  );

  const handleSelectWidget = useCallback((type: LiveActivityWidgetType) => {
    if (isPremiumLiveActivityType(type) && !isPremium) return; // Gate premium
    setLiveActivityWidgetType(type);
    setActiveWidget(type);
    if (liveActivityActive) {
      updateLiveActivity(type);
    }
  }, [liveActivityActive, isPremium]);

  const handleStart = useCallback(() => {
    syncLiveActivity(activeWidget);
    setLiveActivityActive(true);
  }, [activeWidget]);

  const handleStop = useCallback(() => {
    endLiveActivity();
    setLiveActivityActive(false);
  }, []);

  if (Platform.OS !== 'ios') {
    return (
      <View style={styles.container}>
        <ScreenGradient>
          <Text variant="body" color="secondary" style={styles.unsupported}>
            Dynamic Island is available on iPhone with iOS 16.2 or later.
          </Text>
        </ScreenGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text variant="sectionTitle" color="primary" style={styles.title}>
            Dynamic Island
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Live Activity in Dynamic Island and Lock Screen. Choose what to show. iPhone 14 Pro or later for Dynamic Island.
          </Text>

          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text variant="title" color="primary">Status</Text>
              <View style={[styles.badge, liveActivityActive ? styles.badgeActive : styles.badgeInactive]}>
                <Text variant="caption" style={styles.badgeText}>
                  {liveActivityActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, liveActivityActive && styles.buttonDisabled]}
                onPress={handleStart}
                disabled={liveActivityActive}
              >
                <Text variant="body" color="primary">Start</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, !liveActivityActive && styles.buttonDisabled]}
                onPress={handleStop}
                disabled={!liveActivityActive}
              >
                <Text variant="body" color="primary">Stop</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text variant="title" color="primary" style={styles.sectionTitle}>
            Show in Dynamic Island
          </Text>
          <Text variant="caption" color="secondary" style={styles.sectionSubtitle}>
            Tap to select. Compact view shows key metric; long-press to expand.
          </Text>

          {WIDGET_OPTIONS.map(({ type, title, description }) => {
            const locked = isPremiumLiveActivityType(type) && !isPremium;
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionCard,
                  activeWidget === type && styles.optionCardSelected,
                  locked && styles.optionCardLocked,
                ]}
                onPress={() => handleSelectWidget(type)}
                activeOpacity={locked ? 1 : 0.7}
              >
                <View style={styles.optionHeader}>
                  <Text variant="title" color="primary">{title}</Text>
                  {locked && (
                    <View style={styles.premiumBadge}>
                      <Text variant="caption" style={styles.premiumBadgeText}>Premium</Text>
                    </View>
                  )}
                  {activeWidget === type && !locked && (
                    <View style={styles.selectedDot} />
                  )}
                </View>
                <Text variant="caption" color="secondary" style={styles.optionDescription}>
                  {locked ? 'Upgrade to Premium to use this' : description}
                </Text>
              </TouchableOpacity>
            );
          })}

          <Text variant="caption" color="secondary" style={styles.hint}>
            Data updates when you open the app. Live Activity lasts up to 8 hours in Dynamic Island.
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
  unsupported: {
    padding: Spacing[4],
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: Colors.cardLighter,
    borderRadius: 12,
    padding: Spacing[4],
    marginBottom: Spacing[4],
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  badge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: 6,
  },
  badgeActive: { backgroundColor: Colors.success },
  badgeInactive: {
    backgroundColor: Colors.divider,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  badgeText: { color: Colors.textPrimary, fontSize: Typography.badge },
  actions: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  button: {
    flex: 1,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    backgroundColor: Colors.divider,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  sectionTitle: { marginBottom: Spacing[1] },
  sectionSubtitle: { marginBottom: Spacing[3] },
  optionCard: {
    backgroundColor: Colors.cardLighter,
    borderRadius: 12,
    padding: Spacing[4],
    marginBottom: Spacing[2],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: Colors.percent,
  },
  optionCardLocked: {
    opacity: 0.5,
  },
  premiumBadge: {
    backgroundColor: Colors.percent,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumBadgeText: {
    color: Colors.background,
    fontSize: Typography.micro,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[1],
  },
  optionDescription: { marginTop: 0 },
  selectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.percent,
  },
  hint: {
    marginTop: Spacing[4],
    fontStyle: 'italic',
  },
});
