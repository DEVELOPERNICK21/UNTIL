/**
 * Live Island screen (iOS Dynamic Island / Live Activity · Android floating pill + live notification)
 */

import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, ScreenGradient } from '../../../shared/ui';
import { Spacing, Typography, useTheme } from '../../../shared/theme';
import type { ThemePalette } from '../../../shared/theme';
import { useDynamicIslandControl } from '../hooks/useDynamicIslandControl';
import { useOverlayControl } from '../hooks/useOverlayControl';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import type { RootStackParamList } from '../../../shared/navigation/types';

export function DynamicIslandScreen() {
  if (Platform.OS === 'android') {
    return <AndroidLiveIslandScreen />;
  }
  return <IosDynamicIslandScreen />;
}

function IosDynamicIslandScreen() {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    options,
    liveActivityActive,
    problem,
    showSettingsAction,
    handleSelectWidget,
    handleStart,
    handleStop,
    handleOpenSettings,
  } = useDynamicIslandControl();

  return (
    <LiveIslandLayout
      title={t('widgets.island.ios.name')}
      subtitle={t('widgets.island.ios.subtitle')}
      sectionTitle={t('widgets.island.sectionTitle')}
      sectionSubtitle={t('widgets.island.ios.sectionSubtitle')}
      hint={t('widgets.island.ios.hint')}
      active={liveActivityActive}
      options={options}
      onSelect={handleSelectWidget}
      onPremium={() => navigation.navigate('Premium')}
      onStart={handleStart}
      onStop={handleStop}
      startDisabled={liveActivityActive}
      stopDisabled={!liveActivityActive}
      permissionBanner={
        problem
          ? {
              text: problem,
              actionLabel: showSettingsAction
                ? t('widgets.island.openSettings')
                : undefined,
              onAction: showSettingsAction ? handleOpenSettings : undefined,
            }
          : null
      }
    />
  );
}

function AndroidLiveIslandScreen() {
  const { t } = useTranslation();
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
      title={t('widgets.island.android.name')}
      subtitle={t('widgets.island.android.subtitle')}
      sectionTitle={t('widgets.island.sectionTitle')}
      sectionSubtitle={t('widgets.island.android.sectionSubtitle')}
      hint={t('widgets.island.android.hint')}
      active={overlayActive}
      options={options}
      onSelect={handleSelectWidget}
      onPremium={() => navigation.navigate('Premium')}
      onStart={handleStart}
      onStop={handleStop}
      startDisabled={overlayActive}
      stopDisabled={!overlayActive}
      permissionBanner={
        error || hasPermission === false
          ? {
              text: error ?? t('widgets.island.android.banner'),
              actionLabel: t('widgets.island.openSettings'),
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
  onPremium,
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
  /** Called instead of `onSelect` for an option that needs Premium. */
  onPremium: () => void;
  onStart: () => void;
  onStop: () => void;
  startDisabled: boolean;
  stopDisabled: boolean;
  permissionBanner?: {
    text: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
              {permissionBanner.onAction ? (
                <TouchableOpacity
                  style={styles.permissionButton}
                  onPress={permissionBanner.onAction}
                >
                  <Text variant="body" color="primary">
                    {permissionBanner.actionLabel}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text variant="title" color="primary">
                {t('widgets.island.status')}
              </Text>
              <View
                style={[
                  styles.badge,
                  active ? styles.badgeActive : styles.badgeInactive,
                ]}
              >
                <Text variant="caption" style={styles.badgeText}>
                  {active ? t('widgets.status.active') : t('widgets.status.inactive')}
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
                  {t('widgets.island.start')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, stopDisabled && styles.buttonDisabled]}
                onPress={onStop}
                disabled={stopDisabled}
              >
                <Text variant="body" color="primary">
                  {t('widgets.island.stop')}
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
              onPress={() =>
                option.lockedPremium ? onPremium() : onSelect(option.type)
              }
              activeOpacity={option.locked && !option.lockedPremium ? 1 : 0.7}
            >
              <View style={styles.optionHeader}>
                <Text variant="title" color="primary">
                  {option.title}
                </Text>
                {option.comingSoon && (
                  <View style={[styles.premiumBadge, styles.soonBadge]}>
                    <Text variant="caption" style={styles.premiumBadgeText}>
                      {t('widgets.tile.soon')}
                    </Text>
                  </View>
                )}
                {option.lockedPremium && (
                  <View style={styles.premiumBadge}>
                    <Text variant="caption" style={styles.premiumBadgeText}>
                      {t('widgets.tile.premium')}
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
                  ? t('widgets.tile.comingSoon')
                  : option.lockedPremium
                  ? t('widgets.island.upgradeToUse')
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

function createStyles(theme: ThemePalette) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: {
      paddingHorizontal: Spacing[4],
      paddingTop: Spacing[3],
      paddingBottom: Spacing[5],
    },
    title: { marginBottom: Spacing[2] },
    subtitle: { marginBottom: Spacing[4] },
    permissionCard: {
      backgroundColor: theme.cardLighter,
      borderRadius: 12,
      padding: Spacing[4],
      marginBottom: Spacing[4],
      borderWidth: 1,
      borderColor: theme.percent,
    },
    permissionText: {
      marginBottom: Spacing[2],
    },
    permissionButton: {
      alignSelf: 'flex-start',
      paddingVertical: Spacing[2],
      paddingHorizontal: Spacing[3],
      backgroundColor: theme.percent,
      borderRadius: 8,
    },
    statusCard: {
      backgroundColor: theme.cardLighter,
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
    badgeActive: { backgroundColor: theme.success },
    badgeInactive: {
      backgroundColor: theme.divider,
      borderWidth: 1,
      borderColor: theme.divider,
    },
    badgeText: { color: theme.textPrimary, fontSize: Typography.badge },
    actions: {
      flexDirection: 'row',
      gap: Spacing[2],
    },
    button: {
      flex: 1,
      paddingVertical: Spacing[2],
      paddingHorizontal: Spacing[3],
      backgroundColor: theme.divider,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonDisabled: { opacity: 0.5 },
    sectionTitle: { marginBottom: Spacing[1] },
    sectionSubtitle: { marginBottom: Spacing[3] },
    optionCard: {
      backgroundColor: theme.cardLighter,
      borderRadius: 12,
      padding: Spacing[4],
      marginBottom: Spacing[2],
      borderWidth: 2,
      borderColor: 'transparent',
    },
    optionCardSelected: {
      borderColor: theme.percent,
    },
    optionCardLocked: {
      opacity: 0.5,
    },
    premiumBadge: {
      backgroundColor: theme.percent,
      paddingHorizontal: Spacing[2],
      paddingVertical: 2,
      borderRadius: 4,
    },
    soonBadge: {
      backgroundColor: 'rgba(160, 160, 160, 0.45)',
    },
    premiumBadgeText: {
      color: theme.background,
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
      backgroundColor: theme.percent,
    },
    hint: {
      marginTop: Spacing[4],
      fontStyle: 'italic',
    },
  });
}
