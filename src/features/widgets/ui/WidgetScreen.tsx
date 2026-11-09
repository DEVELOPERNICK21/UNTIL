import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useWidgetSurfaceStatus } from '../hooks/useWidgetSurfaceStatus';
import { useAccessControl } from '../../premium';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, ScreenGradient } from '../../../shared/ui';
import { Spacing, Radius, Typography, useTheme } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import type { ThemePalette } from '../../../shared/theme';
import type { RootStackParamList } from '../../../shared/navigation/types';
import { AddToHomeScreenSection } from './AddToHomeScreenSection';
import { PREMIUM_WIDGET_TILES } from '../config/premiumWidgetTiles';

function SectionHeader({ label }: { label: string }) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <Text variant="caption" color="secondary" style={styles.sectionLabel}>
      {label}
    </Text>
  );
}

interface SettingTileProps {
  title: string;
  description: string;
  status?: 'on' | 'off' | 'active' | 'inactive';
  statusLabel?: string;
  locked?: boolean;
  comingSoon?: boolean;
  onPress?: () => void;
  children?: React.ReactNode;
}

function SettingTile({
  title,
  description,
  status,
  statusLabel,
  locked,
  comingSoon,
  onPress,
  children,
}: SettingTileProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
        {comingSoon && (
          <View style={[styles.premiumPill, styles.comingSoonPill]}>
            <Text variant="caption" style={styles.premiumPillText}>
              {t('widgets.tile.soon')}
            </Text>
          </View>
        )}
        {locked && !comingSoon && (
          <View style={styles.premiumPill}>
            <Text variant="caption" style={styles.premiumPillText}>
              {t('widgets.tile.premium')}
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
        {comingSoon
          ? t('widgets.tile.comingSoon')
          : locked
          ? t('widgets.tile.upgrade')
          : description}
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
        <View
          style={[
            styles.glassTile,
            (locked || comingSoon) && styles.tileLocked,
          ]}
        >
          {content}
          <Text variant="caption" color="secondary" style={styles.tileChevron}>
            {t('widgets.tile.open')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
  return (
    <View
      style={[styles.glassTile, (locked || comingSoon) && styles.tileLocked]}
    >
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
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Widget'>>();
  const { liveActivityActive, overlayActive } = useWidgetSurfaceStatus();
  const { hasPremiumBundle } = useAccessControl();
  const statusLabel = (on: boolean) =>
    t(on ? 'widgets.status.active' : 'widgets.status.inactive');

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text variant="sectionTitle" color="primary" style={styles.title}>
            {t('nav.widgets')}
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            {t('widgets.screen.subtitle')}
          </Text>

          <SectionHeader label={t('widgets.section.alwaysVisible')} />
          <View style={styles.sectionGroup}>
            {Platform.OS === 'ios' && (
              <SettingTile
                title={t('widgets.island.ios.name')}
                description={t('widgets.island.ios.tileDescription')}
                status={liveActivityActive ? 'active' : 'inactive'}
                statusLabel={statusLabel(liveActivityActive)}
                onPress={() => navigation.navigate('DynamicIsland')}
              />
            )}
            {Platform.OS === 'android' && (
              <SettingTile
                title={t('widgets.island.android.name')}
                description={t('widgets.island.android.tileDescription')}
                status={overlayActive ? 'active' : 'inactive'}
                statusLabel={statusLabel(overlayActive)}
                onPress={() => navigation.navigate('DynamicIsland')}
              />
            )}
          </View>

          <AddToHomeScreenSection
            premium={hasPremiumBundle}
            onLocked={() => navigation.navigate('Premium')}
          />

          <SectionHeader label={t('widgets.section.premiumWidgets')} />
          <View style={styles.sectionGroup}>
            {PREMIUM_WIDGET_TILES.map(tile => (
              <SettingTile
                key={tile.titleKey}
                title={t(tile.titleKey)}
                description={t(tile.descriptionKey)}
                locked={!hasPremiumBundle}
                onPress={() =>
                  hasPremiumBundle
                    ? navigation.navigate(tile.route)
                    : navigation.navigate('Premium')
                }
              />
            ))}
          </View>

          {/* Section: Quick links */}
          <SectionHeader label={t('widgets.section.manage')} />
          <View style={styles.sectionGroup}>
            <QuickLinkTile
              title={t('nav.customCounters')}
              subtitle={t('widgets.quick.counters.subtitle')}
              onPress={() => navigation.navigate('CustomCounters')}
            />
            <QuickLinkTile
              title={t('nav.deadlines')}
              subtitle={t('widgets.quick.deadlines.subtitle')}
              onPress={() => navigation.navigate('Countdowns')}
            />
            <QuickLinkTile
              title={t('nav.hourCalculation')}
              subtitle={t('widgets.quick.hour.subtitle')}
              onPress={() => navigation.navigate('HourCalculation')}
            />
            <QuickLinkTile
              title={t('nav.taskReport')}
              subtitle={t('widgets.quick.report.subtitle')}
              onPress={() => navigation.navigate('TaskReport')}
            />
          </View>

          <Text variant="caption" color="secondary" style={styles.hint}>
            {Platform.OS === 'ios' ? t('widgets.hint.ios') : t('widgets.hint.android')}
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

    sectionLabel: {
      letterSpacing: 1.2,
      marginBottom: Spacing[2],
      marginTop: Spacing[2],
    },
    sectionGroup: {
      gap: Spacing[2],
      marginBottom: Spacing[3],
    },
    tileWrapper: {},
    glassTile: {
      backgroundColor: theme.glassBg,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: theme.glassBorder,
      padding: Spacing[3],
      overflow: 'hidden',
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
      borderColor: theme.glassBorder,
    },
    statusPillText: {
      color: theme.textPrimary,
      fontSize: Typography.badge,
    },
    premiumPill: {
      backgroundColor: theme.percent,
      paddingHorizontal: Spacing[2],
      paddingVertical: 2,
      borderRadius: 4,
    },
    premiumPillText: {
      color: theme.background,
      fontSize: Typography.micro,
    },

    quickLinkTouch: {},
    quickLinkTile: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.glassBg,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: theme.glassBorder,
      paddingVertical: Spacing[3],
      paddingHorizontal: Spacing[3],
      overflow: 'hidden',
    },
    quickLinkTitle: {
      marginBottom: 2,
    },
    comingSoonPill: {
      backgroundColor: 'rgba(160, 160, 160, 0.35)',
    },

    hint: {
      marginTop: Spacing[4],
      fontStyle: 'italic',
    },
  });
}
