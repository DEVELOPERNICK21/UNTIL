import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAccessControl, useWidgetSurfaceStatus } from '../../hooks';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, ScreenGradient } from '../../ui';
import { Colors, Spacing, Radius, Typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';

const PREVIEW_ITEMS: {
  key: string;
  title: string;
  value: string;
  subtitle: string;
}[] = [
  {
    key: 'day',
    title: 'Today',
    value: '57% done',
    subtitle: '10h 14m left',
  },
  {
    key: 'month',
    title: 'This month',
    value: '17%',
    subtitle: '23 days left',
  },
  {
    key: 'year',
    title: 'This year',
    value: '9%',
    subtitle: '329 days left',
  },
  {
    key: 'life',
    title: 'Your life',
    value: '31%',
    subtitle: '20,126 days left',
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
              Soon
            </Text>
          </View>
        )}
        {locked && !comingSoon && (
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
        {comingSoon
          ? 'Coming in a future update.'
          : locked
          ? 'Upgrade to Premium to add this widget.'
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
            Open →
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

function ComingSoonQuickRow({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={[styles.quickLinkTile, styles.quickLinkDisabled]}>
      <View style={styles.quickLinkBody}>
        <Text variant="body" color="secondary" style={styles.quickLinkTitle}>
          {title}
        </Text>
        <Text variant="caption" color="secondary">
          {subtitle}
        </Text>
      </View>
      <Text variant="caption" color="secondary">
        Soon
      </Text>
    </View>
  );
}

export function WidgetScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Widget'>>();
  const { hasPremiumBundle, canAccessLife } = useAccessControl();
  const { liveActivityActive, overlayActive } = useWidgetSurfaceStatus();

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

          <SectionHeader label="Preview" />
          <View style={styles.previewStrip}>
            {PREVIEW_ITEMS.map(item => (
              <View key={item.key} style={styles.previewCard}>
                <Text variant="caption" color="secondary" style={styles.previewTitle}>
                  {item.title}
                </Text>
                <Text variant="title" color="primary" style={styles.previewValue}>
                  {item.value}
                </Text>
                <Text variant="caption" color="secondary" style={styles.previewSubtitle}>
                  {item.subtitle}
                </Text>
              </View>
            ))}
          </View>

          {/* Section: Always visible (Dynamic Island / Floating overlay) */}
          <SectionHeader label="Always visible" />
          <GlassSection style={styles.sectionSpacing}>
            {Platform.OS === 'ios' && (
              <SettingTile
                title="Dynamic Island"
                description="Live Activity in Dynamic Island and Lock Screen. Tap to configure."
                status={liveActivityActive ? 'active' : 'inactive'}
                statusLabel={liveActivityActive ? 'Active' : 'Inactive'}
                locked={!(hasPremiumBundle || canAccessLife)}
                onPress={() =>
                  hasPremiumBundle || canAccessLife
                    ? navigation.navigate('DynamicIsland')
                    : navigation.navigate('Premium')
                }
              />
            )}
            {Platform.OS === 'android' && (
              <SettingTile
                title="Floating overlay"
                description="Dynamic Island–like pill over other apps. Drag to move."
                status={overlayActive ? 'active' : 'inactive'}
                statusLabel={overlayActive ? 'Active' : 'Inactive'}
                locked={!(hasPremiumBundle || canAccessLife)}
                onPress={() =>
                  hasPremiumBundle || canAccessLife
                    ? navigation.navigate('Overlay')
                    : navigation.navigate('Premium')
                }
              />
            )}
          </GlassSection>

          {/* Section: Quick links */}
          <SectionHeader label="Manage data & features" />
          <GlassSection style={styles.sectionSpacing}>
            <ComingSoonQuickRow
              title="Custom counters"
              subtitle="Tap-to-increment widgets (e.g. Water)"
            />
            <ComingSoonQuickRow
              title="Deadlines"
              subtitle="Countdown to a date (e.g. project, interview)"
            />
            <ComingSoonQuickRow
              title="Today's tasks"
              subtitle="Daily task list and day report"
            />
            <ComingSoonQuickRow
              title="Hour calculation"
              subtitle="Tap widget to start/stop. Set title in app."
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
  previewStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  previewCard: {
    flexBasis: '48%',
    backgroundColor: Colors.glassHighlight,
    borderColor: Colors.glassBorder,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[2],
  },
  previewTitle: {
    marginBottom: 2,
  },
  previewValue: {
    fontSize: Typography.body,
    marginBottom: 2,
  },
  previewSubtitle: {
    fontSize: Typography.small,
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
  quickLinkBody: {
    flex: 1,
    paddingRight: Spacing[2],
  },
  quickLinkDisabled: {
    opacity: 0.65,
  },
  comingSoonPill: {
    backgroundColor: 'rgba(160, 160, 160, 0.35)',
  },

  hint: {
    marginTop: Spacing[4],
    fontStyle: 'italic',
  },
});
