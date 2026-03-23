/**
 * Dedicated Dynamic Island / Live Activity screen
 * Configure widget type (Day, Month, Year, Life, Daily Task, Hour Calc) and start/stop
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Text, ScreenGradient } from '../../ui';
import { Colors, Spacing, Typography } from '../../theme';
import { useDynamicIslandControl } from '../../hooks';

export function DynamicIslandScreen() {
  const {
    options,
    liveActivityActive,
    handleSelectWidget,
    handleStart,
    handleStop,
    isIos,
  } = useDynamicIslandControl();

  if (!isIos) {
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
            Live Activity in Dynamic Island and Lock Screen. Choose what to
            show. iPhone 14 Pro or later for Dynamic Island.
          </Text>

          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text variant="title" color="primary">
                Status
              </Text>
              <View
                style={[
                  styles.badge,
                  liveActivityActive
                    ? styles.badgeActive
                    : styles.badgeInactive,
                ]}
              >
                <Text variant="caption" style={styles.badgeText}>
                  {liveActivityActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.button,
                  liveActivityActive && styles.buttonDisabled,
                ]}
                onPress={handleStart}
                disabled={liveActivityActive}
              >
                <Text variant="body" color="primary">
                  Start
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  !liveActivityActive && styles.buttonDisabled,
                ]}
                onPress={handleStop}
                disabled={!liveActivityActive}
              >
                <Text variant="body" color="primary">
                  Stop
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text variant="title" color="primary" style={styles.sectionTitle}>
            Show in Dynamic Island
          </Text>
          <Text
            variant="caption"
            color="secondary"
            style={styles.sectionSubtitle}
          >
            Tap to select. Compact view shows key metric; long-press to expand.
          </Text>

          {options.map(({ type, title, description, selected, comingSoon, lockedPremium, locked }) => {
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionCard,
                  selected && styles.optionCardSelected,
                  locked && styles.optionCardLocked,
                ]}
                onPress={() => handleSelectWidget(type)}
                activeOpacity={locked ? 1 : 0.7}
              >
                <View style={styles.optionHeader}>
                  <Text variant="title" color="primary">
                    {title}
                  </Text>
                  {comingSoon && (
                    <View style={[styles.premiumBadge, styles.soonBadge]}>
                      <Text variant="caption" style={styles.premiumBadgeText}>
                        Soon
                      </Text>
                    </View>
                  )}
                  {lockedPremium && (
                    <View style={styles.premiumBadge}>
                      <Text variant="caption" style={styles.premiumBadgeText}>
                        Premium
                      </Text>
                    </View>
                  )}
                  {selected && !locked && (
                    <View style={styles.selectedDot} />
                  )}
                </View>
                <Text
                  variant="caption"
                  color="secondary"
                  style={styles.optionDescription}
                >
                  {comingSoon
                    ? 'Coming in a future update.'
                    : lockedPremium
                    ? 'Upgrade to Premium to use this'
                    : description}
                </Text>
              </TouchableOpacity>
            );
          })}

          <Text variant="caption" color="secondary" style={styles.hint}>
            Data updates when you open the app. Live Activity lasts up to 8
            hours in Dynamic Island.
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
  soonBadge: {
    backgroundColor: 'rgba(160, 160, 160, 0.45)',
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
