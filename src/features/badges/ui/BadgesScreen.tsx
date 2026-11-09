import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgeMedal } from './BadgeMedal';
import {
  GlassCard,
  ProgressRing,
  ScreenGradient,
  Text,
} from '../../../shared/ui';
import { FontFamily, Spacing } from '../../../shared/theme';
import { useBadges } from '../hooks/useBadges';
import { usePresenceStreak } from '../../presence';
import { logAnalyticsEvent } from '../../../shared/analytics/analytics';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import type { TranslationKey } from '../../../shared/i18n/translate';
import { BadgeUnlockOverlay } from './BadgeUnlockOverlay';
import { badgeDescription, badgeTitle, progressLabel } from './badgeLabels';
import type { BadgeFamily } from '../domain/badgeCatalog';
import type { BadgeView } from '../domain/useCases/GetBadgesUseCase';

const SECTIONS: Array<{ family: BadgeFamily; titleKey: TranslationKey }> = [
  { family: 'presence', titleKey: 'badges.section.presence' },
  { family: 'tasks', titleKey: 'badges.section.tasks' },
  { family: 'time', titleKey: 'badges.section.time' },
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
  const { t } = useTranslation();
  const status = view.earned ? t('badges.earned') : progressLabel(view, t);
  return (
    <Pressable
      onPress={onPress}
      style={styles.cell}
      accessibilityRole="button"
      accessibilityLabel={t('badges.a11y.item', {
        title: badgeTitle(view.definition, t),
        status,
        description: badgeDescription(view.definition, t),
      })}
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
        {badgeTitle(view.definition, t)}
      </Text>
      <Text variant="micro" color="secondary" numberOfLines={1}>
        {status}
      </Text>
    </Pressable>
  );
}

export function BadgesScreen() {
  const { t } = useTranslation();
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
    ? t('badges.freeze.ready')
    : t('badges.freeze.used');

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
                {t('badges.summary.count', { earned: earnedCount, total })}
              </Text>
              <Text variant="caption" color="secondary">
                {t('badges.summary.streak', {
                  count: streak.count,
                  best: streak.longest,
                })}
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
                  {t(section.titleKey)}
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
