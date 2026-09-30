import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgeMedal, GlassCard, ProgressRing, ScreenGradient, Text } from '../../ui';
import { FontFamily, Spacing } from '../../theme';
import { useBadges, usePresenceStreak } from '../../hooks';
import { logAnalyticsEvent } from '../../services/analytics';
import { BadgeUnlockOverlay } from '../../components/gamification';
import { progressLabel } from '../../components/gamification/badgeLabels';
import type { BadgeFamily } from '../../domain/badges/badgeCatalog';
import type { BadgeView } from '../../domain/useCases/GetBadgesUseCase';

const SECTIONS: Array<{ family: BadgeFamily; title: string }> = [
  { family: 'presence', title: 'Streaks' },
  { family: 'tasks', title: 'Tasks' },
  { family: 'time', title: 'Your time' },
];

const MEDAL_SIZE = 68;

function BadgeCell({
  view,
  index,
  onPress,
}: {
  view: BadgeView;
  index: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.cell}
      accessibilityRole="button"
      accessibilityLabel={`${view.definition.title}. ${
        view.earned ? 'Earned' : progressLabel(view)
      }. ${view.definition.description}`}
    >
      <BadgeMedal
        glyph={view.definition.glyph}
        tier={view.definition.tier}
        size={MEDAL_SIZE}
        locked={!view.earned}
        progress={view.earned ? undefined : view.progress.ratio}
        enter="pop"
        enterDelay={80 + index * 55}
        shine={view.earned ? 'once' : 'none'}
      />
      <Text
        variant="caption"
        color={view.earned ? 'primary' : 'secondary'}
        numberOfLines={2}
        style={styles.cellTitle}
      >
        {view.definition.title}
      </Text>
      <Text variant="micro" color="secondary" numberOfLines={1}>
        {view.earned ? 'Earned' : progressLabel(view)}
      </Text>
    </Pressable>
  );
}

export function BadgesScreen() {
  const insets = useSafeAreaInsets();
  const { badges, earnedCount, total } = useBadges();
  const { streak } = usePresenceStreak();
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    logAnalyticsEvent('badges_opened', { earned: earnedCount }).catch(() => {});
    // Once per visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const opened = useMemo(
    () => badges.find(b => b.definition.id === openId) ?? null,
    [badges, openId],
  );
  const closeDetail = useCallback(() => setOpenId(null), []);

  const freezeLine = streak.freezeAvailable
    ? 'One missed day is forgiven. Ready now.'
    : 'Freeze used. It comes back after 7 days in a row.';

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, Spacing[3]) + Spacing[5] },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <GlassCard style={styles.summary}>
            <ProgressRing progress={total > 0 ? earnedCount / total : 0} size={76} strokeWidth={7}>
              <Text variant="title" color="primary" style={styles.ringNumber}>
                {earnedCount}
              </Text>
            </ProgressRing>
            <View style={styles.summaryCopy}>
              <Text variant="sectionTitle" color="primary">
                {earnedCount} of {total} badges
              </Text>
              <Text variant="caption" color="secondary">
                Streak: {streak.count} {streak.count === 1 ? 'day' : 'days'}. Best:{' '}
                {streak.longest}.
              </Text>
              <Text variant="micro" color="secondary">
                {freezeLine}
              </Text>
            </View>
          </GlassCard>

          {SECTIONS.map(section => {
            const items = badges.filter(b => b.definition.family === section.family);
            if (items.length === 0) return null;
            return (
              <View key={section.family} style={styles.section}>
                <Text variant="sectionTitle" color="secondary" style={styles.sectionTitle}>
                  {section.title}
                </Text>
                <View style={styles.grid}>
                  {items.map((b, i) => (
                    <BadgeCell
                      key={b.definition.id}
                      view={b}
                      index={i}
                      onPress={() => setOpenId(b.definition.id)}
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </ScreenGradient>

      {opened ? (
        <BadgeUnlockOverlay
          badge={opened}
          mode="detail"
          earnedCount={earnedCount}
          total={total}
          onClose={closeDetail}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingTop: Spacing[3],
    paddingHorizontal: Spacing[4],
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  summaryCopy: {
    flex: 1,
    gap: 2,
  },
  ringNumber: {
    fontFamily: FontFamily.medium,
  },
  section: {
    marginBottom: Spacing[4],
  },
  sectionTitle: {
    marginBottom: Spacing[2],
    letterSpacing: 0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing[3],
  },
  cell: {
    width: '33.333%',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  cellTitle: {
    textAlign: 'center',
    fontFamily: FontFamily.medium,
  },
});
