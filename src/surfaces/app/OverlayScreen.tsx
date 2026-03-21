/**
 * Android floating overlay screen – Dynamic Island–like experience
 * Configure widget type and start/stop the overlay. Requires "Display over other apps" permission.
 */

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, ScreenGradient } from '../../ui';
import { Colors, Spacing, Typography } from '../../theme';
import { useOverlayControl } from '../../hooks';

export function OverlayScreen() {
  const {
    options,
    hasPermission,
    overlayActive,
    error,
    handleSelectWidget,
    handleStart,
    handleStop,
    handleOpenSettings,
    isAndroid,
  } = useOverlayControl();

  if (!isAndroid) {
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
            Dynamic Island–like pill that floats over other apps. Drag to move,
            long-press to open Until.
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
            Tap to select. Compact pill shows key metric.
          </Text>

          {options.map(option => {
            return (
              <TouchableOpacity
                key={option.type}
                style={[
                  styles.optionCard,
                  option.selected && styles.optionCardSelected,
                  option.locked && styles.optionCardLocked,
                ]}
                onPress={() => handleSelectWidget(option.type)}
                activeOpacity={option.locked ? 1 : 0.7}
              >
                <View style={styles.optionHeader}>
                  <Text variant="title" color="primary">
                    {option.title}
                  </Text>
                  {option.comingSoon && (
                    <View style={[styles.premiumBadge, styles.soonBadge]}>
                      <Text variant="caption" style={styles.premiumBadgeText}>
                        Soon
                      </Text>
                    </View>
                  )}
                  {option.lockedPremium && (
                    <View style={styles.premiumBadge}>
                      <Text variant="caption" style={styles.premiumBadgeText}>
                        Premium
                      </Text>
                    </View>
                  )}
                  {option.selected && !option.locked && (
                    <View style={styles.selectedDot} />
                  )}
                </View>
                <Text
                  variant="caption"
                  color="secondary"
                  style={styles.optionDescription}
                >
                  {option.comingSoon
                    ? 'Coming in a future update.'
                    : option.lockedPremium
                    ? 'Upgrade to Premium to use this'
                    : option.description}
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
