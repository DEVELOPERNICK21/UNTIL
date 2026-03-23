import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useWidgetSurfaceStatus } from '../../hooks';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, ScreenGradient } from '../../ui';
import { Colors, Spacing, Radius, Typography, useTheme } from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';

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
  cardStyle,
}: {
  children: React.ReactNode;
  style?: object;
  cardStyle: object;
}) {
  return (
    <View style={[styles.glassSection, cardStyle, style]}>{children}</View>
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
  cardStyle: object;
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
  cardStyle,
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
            cardStyle,
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
      style={[
        styles.glassTile,
        cardStyle,
        (locked || comingSoon) && styles.tileLocked,
      ]}
    >
      {content}
    </View>
  );
}

function QuickLinkTile({
  title,
  subtitle,
  onPress,
  cardStyle,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
  cardStyle: object;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.quickLinkTouch}
    >
      <View style={[styles.quickLinkTile, cardStyle]}>
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
  const { liveActivityActive, overlayActive } = useWidgetSurfaceStatus();
  const theme = useTheme();
  const isLight = theme.statusBarStyle === 'dark-content';

  const elevatedLightCard = isLight
    ? styles.lightCardSurface
    : styles.darkCardSurface;

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

          {/* Section: Always visible (Dynamic Island / Floating overlay) */}
          <SectionHeader label="Always visible" />
          <GlassSection
            style={styles.sectionSpacing}
            cardStyle={elevatedLightCard}
          >
            {Platform.OS === 'ios' && (
              <SettingTile
                title="Dynamic Island"
                description="Live Activity in Dynamic Island and Lock Screen. Tap to configure."
                status={liveActivityActive ? 'active' : 'inactive'}
                statusLabel={liveActivityActive ? 'Active' : 'Inactive'}
                onPress={() => navigation.navigate('DynamicIsland')}
                cardStyle={elevatedLightCard}
              />
            )}
            {Platform.OS === 'android' && (
              <SettingTile
                title="Floating overlay"
                description="Dynamic Island–like pill over other apps. Drag to move."
                status={overlayActive ? 'active' : 'inactive'}
                statusLabel={overlayActive ? 'Active' : 'Inactive'}
                onPress={() => navigation.navigate('Overlay')}
                cardStyle={elevatedLightCard}
              />
            )}
          </GlassSection>

          {/* Section: Quick links */}
          <SectionHeader label="Manage data & features" />
          <GlassSection
            style={styles.sectionSpacing}
            cardStyle={elevatedLightCard}
          >
            <QuickLinkTile
              title="Custom counters"
              subtitle="Tap-to-increment widgets (e.g. Water)"
              onPress={() => navigation.navigate('CustomCounters')}
              cardStyle={elevatedLightCard}
            />
            <QuickLinkTile
              title="Deadlines"
              subtitle="Countdown to a date (e.g. project, interview)"
              onPress={() => navigation.navigate('Countdowns')}
              cardStyle={elevatedLightCard}
            />
            <QuickLinkTile
              title="Hour calculation"
              subtitle="Tap widget to start/stop. Set title in app."
              onPress={() => navigation.navigate('HourCalculation')}
              cardStyle={elevatedLightCard}
            />
            <QuickLinkTile
              title="Task report"
              subtitle="Daily, weekly & monthly charts"
              onPress={() => navigation.navigate('TaskReport')}
              cardStyle={elevatedLightCard}
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
  lightCardSurface: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(15, 23, 42, 0.08)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  darkCardSurface: {
    backgroundColor: Colors.glassHighlight,
    borderColor: Colors.glassBorder,
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
  comingSoonPill: {
    backgroundColor: 'rgba(160, 160, 160, 0.35)',
  },

  hint: {
    marginTop: Spacing[4],
    fontStyle: 'italic',
  },
});
