/**
 * Live Island screen (iOS Dynamic Island / Live Activity · Android floating pill + live notification)
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, ScreenGradient } from '../../ui';
import { Colors, Spacing, Typography } from '../../theme';
import { useDynamicIslandControl, useOverlayControl } from '../../hooks';
import type { RootStackParamList } from '../../navigation/types';

export function DynamicIslandScreen() {
  if (Platform.OS === 'android') {
    return <AndroidLiveIslandScreen />;
  }
  return <IosDynamicIslandScreen />;
}

function IosDynamicIslandScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    options,
    liveActivityActive,
    handleSelectWidget,
    handleStart,
    handleStop,
  } = useDynamicIslandControl();

  return (
    <LiveIslandLayout
      title="Dynamic Island"
      subtitle="See how much time you have left on Dynamic Island and Lock Screen. Compact shows % left and time left. Long-press for more. iPhone 14 Pro or later for Dynamic Island."
      sectionTitle="What to show"
      sectionSubtitle="Pick one. Change anytime while Live Activity is running. Updates when you open the app."
      hint="Numbers refresh when you open UNTIL. Live Activity can stay up to about 8 hours. Stickers pulse while active."
      active={liveActivityActive}
      options={options}
      onSelect={type => {
        const option = options.find(o => o.type === type);
        if (option?.lockedPremium) {
          navigation.navigate('Premium');
          return;
        }
        handleSelectWidget(type);
      }}
      onStart={handleStart}
      onStop={handleStop}
      startDisabled={liveActivityActive}
      stopDisabled={!liveActivityActive}
    />
  );
}

function AndroidLiveIslandScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    options,
    hasPermission,
    overlayActive,
    error,
    handleSelectWidget,
    handleStart,
    handleStop,
    handleOpenSettings,
  } = useOverlayControl();

  return (
    <LiveIslandLayout
      title="Live Island"
      subtitle="Lock-screen progress notification, plus a floating pill over other apps when you allow “Display over other apps.” On Android 16, the system can promote this to a status-bar chip."
      sectionTitle="What to show"
      sectionSubtitle="Pick one. Compact pill and notification update together."
      hint="Lock-screen progress works without overlay permission. Grant “Display over other apps” for the floating pill. Drag to move · long-press to open Until."
      active={overlayActive}
      options={options}
      onSelect={type => {
        const option = options.find(o => o.type === type);
        if (option?.lockedPremium) {
          navigation.navigate('Premium');
          return;
        }
        handleSelectWidget(type);
      }}
      onStart={handleStart}
      onStop={handleStop}
      startDisabled={overlayActive}
      stopDisabled={!overlayActive}
      permissionBanner={
        error || hasPermission === false
          ? {
              text:
                error ??
                'Optional: allow “Display over other apps” for the floating pill. Lock-screen progress still works after Start.',
              actionLabel: 'Open settings',
              onAction: handleOpenSettings,
            }
          : null
      }
    />
  );
}

type IslandOption = {
  type: string;
  title: string;
  description: string;
  selected: boolean;
  comingSoon?: boolean;
  lockedPremium?: boolean;
  locked?: boolean;
};

function LiveIslandLayout({
  title,
  subtitle,
  sectionTitle,
  sectionSubtitle,
  hint,
  active,
  options,
  onSelect,
  onStart,
  onStop,
  startDisabled,
  stopDisabled,
  permissionBanner,
}: {
  title: string;
  subtitle: string;
  sectionTitle: string;
  sectionSubtitle: string;
  hint: string;
  active: boolean;
  options: IslandOption[];
  onSelect: (type: any) => void;
  onStart: () => void;
  onStop: () => void;
  startDisabled: boolean;
  stopDisabled: boolean;
  permissionBanner?: {
    text: string;
    actionLabel: string;
    onAction: () => void;
  } | null;
}) {
  return (
    <View style={styles.container}>
      <ScreenGradient>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text variant="sectionTitle" color="primary" style={styles.title}>
            {title}
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            {subtitle}
          </Text>

          {permissionBanner ? (
            <View style={styles.permissionCard}>
              <Text
                variant="body"
                color="primary"
                style={styles.permissionText}
              >
                {permissionBanner.text}
              </Text>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={permissionBanner.onAction}
              >
                <Text variant="body" color="primary">
                  {permissionBanner.actionLabel}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text variant="title" color="primary">
                Status
              </Text>
              <View
                style={[
                  styles.badge,
                  active ? styles.badgeActive : styles.badgeInactive,
                ]}
              >
                <Text variant="caption" style={styles.badgeText}>
                  {active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, startDisabled && styles.buttonDisabled]}
                onPress={onStart}
                disabled={startDisabled}
              >
                <Text variant="body" color="primary">
                  Start
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, stopDisabled && styles.buttonDisabled]}
                onPress={onStop}
                disabled={stopDisabled}
              >
                <Text variant="body" color="primary">
                  Stop
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text variant="title" color="primary" style={styles.sectionTitle}>
            {sectionTitle}
          </Text>
          <Text
            variant="caption"
            color="secondary"
            style={styles.sectionSubtitle}
          >
            {sectionSubtitle}
          </Text>

          {options.map(option => (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.optionCard,
                option.selected && styles.optionCardSelected,
                option.locked && styles.optionCardLocked,
              ]}
              onPress={() => onSelect(option.type)}
              activeOpacity={option.locked && !option.lockedPremium ? 1 : 0.7}
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
          ))}

          <Text variant="caption" color="secondary" style={styles.hint}>
            {hint}
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
