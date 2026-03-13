/**
 * Android floating overlay screen – Dynamic Island–like experience
 * Configure widget type and start/stop the overlay. Requires "Display over other apps" permission.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Text, ScreenGradient } from '../../ui';
import { Colors, Spacing } from '../../theme';
import {
  startOverlay,
  stopOverlay,
  getOverlayWidgetType,
  setOverlayWidgetType,
  updateOverlay,
  isOverlayEnabled,
  canDrawOverlays,
  requestOverlayPermission,
} from '../../infrastructure';
import type { OverlayWidgetType } from '../../infrastructure';
import { useObserveSubscription } from '../../hooks';
import { isPremiumLiveActivityType } from '../../domain/premium';

const WIDGET_OPTIONS: {
  type: OverlayWidgetType;
  title: string;
  description: string;
}[] = [
  {
    type: 'day',
    title: 'Today',
    description: '57% done · 42% left. Day progress with hours.',
  },
  {
    type: 'month',
    title: 'This month',
    description: 'Feb 17% · 23d left. Month progress.',
  },
  {
    type: 'year',
    title: 'This year',
    description: '9% · 329d left. Year progress.',
  },
  {
    type: 'life',
    title: 'Your life',
    description: 'Life progress. Set birth date in Settings.',
  },
  {
    type: 'dailyTasks',
    title: 'Daily tasks',
    description: "3/5 done. Today's task report.",
  },
  {
    type: 'hourCalc',
    title: 'Hour timer',
    description: '0:12:34. Tap to start/stop.',
  },
];

export function OverlayScreen() {
  const { isPremium } = useObserveSubscription();
  const [activeWidget, setActiveWidget] = useState<OverlayWidgetType>(
    getOverlayWidgetType(),
  );
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [overlayActive, setOverlayActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(() => {
    setActiveWidget(getOverlayWidgetType());
    setError(null);
    canDrawOverlays()
      .then(setHasPermission)
      .catch(() => setHasPermission(false));
    setOverlayActive(isOverlayEnabled());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshStatus();
    }, [refreshStatus]),
  );

  const handleSelectWidget = useCallback(
    (type: OverlayWidgetType) => {
      if (isPremiumLiveActivityType(type) && !isPremium) return;
      setOverlayWidgetType(type);
      setActiveWidget(type);
      updateOverlay();
    },
    [isPremium],
  );

  const handleStart = useCallback(() => {
    if (hasPermission === false) {
      requestOverlayPermission();
      return;
    }
    try {
      startOverlay();
      setOverlayActive(true);
      setError(null);
    } catch (e) {
      setError(
        'Could not start overlay. Grant "Display over other apps" permission.',
      );
    }
  }, [hasPermission]);

  const handleStop = useCallback(() => {
    stopOverlay();
    setOverlayActive(false);
  }, []);

  const handleOpenSettings = useCallback(() => {
    requestOverlayPermission();
  }, []);

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.container}>
        <ScreenGradient>
          <Text variant="body" color="secondary" style={styles.unsupported}>
            Floating overlay is available on Android only.
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
            Floating overlay
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Dynamic Island–like pill that floats over other apps. Tap to expand,
            drag to move, long-press to open Until.
          </Text>

          {error && (
            <View style={styles.permissionCard}>
              <Text
                variant="body"
                color="primary"
                style={styles.permissionText}
              >
                {error}
              </Text>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={handleOpenSettings}
              >
                <Text variant="body" color="primary">
                  Open settings
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {hasPermission === false && !error && (
            <View style={styles.permissionCard}>
              <Text
                variant="body"
                color="primary"
                style={styles.permissionText}
              >
                Allow &quot;Display over other apps&quot; to show the overlay.
              </Text>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={handleOpenSettings}
              >
                <Text variant="body" color="primary">
                  Open settings
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text variant="title" color="primary">
                Status
              </Text>
              <View
                style={[
                  styles.badge,
                  overlayActive ? styles.badgeActive : styles.badgeInactive,
                ]}
              >
                <Text variant="caption" style={styles.badgeText}>
                  {overlayActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.button,
                  (overlayActive || hasPermission !== true) &&
                    styles.buttonDisabled,
                ]}
                onPress={handleStart}
                disabled={overlayActive || hasPermission !== true}
              >
                <Text variant="body" color="primary">
                  Start
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, !overlayActive && styles.buttonDisabled]}
                onPress={handleStop}
                disabled={!overlayActive}
              >
                <Text variant="body" color="primary">
                  Stop
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text variant="title" color="primary" style={styles.sectionTitle}>
            Show in overlay
          </Text>
          <Text
            variant="caption"
            color="secondary"
            style={styles.sectionSubtitle}
          >
            Tap to select. Compact pill shows key metric; tap to expand.
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
                  <Text variant="title" color="primary">
                    {title}
                  </Text>
                  {locked && (
                    <View style={styles.premiumBadge}>
                      <Text variant="caption" style={styles.premiumBadgeText}>
                        Premium
                      </Text>
                    </View>
                  )}
                  {activeWidget === type && !locked && (
                    <View style={styles.selectedDot} />
                  )}
                </View>
                <Text
                  variant="caption"
                  color="secondary"
                  style={styles.optionDescription}
                >
                  {locked ? 'Upgrade to Premium to use this' : description}
                </Text>
              </TouchableOpacity>
            );
          })}

          <Text variant="caption" color="secondary" style={styles.hint}>
            Data updates when you open the app. Drag the pill to reposition. A
            notification keeps the overlay running.
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
  permissionCard: {
    backgroundColor: Colors.cardLighter,
    borderRadius: 12,
    padding: Spacing[4],
    marginBottom: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.percent,
  },
  permissionText: {
    marginBottom: Spacing[2],
  },
  permissionButton: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    backgroundColor: Colors.percent,
    borderRadius: 8,
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
  badgeText: { color: Colors.textPrimary, fontSize: 11 },
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
    fontSize: 10,
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
