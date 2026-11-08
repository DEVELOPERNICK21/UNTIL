import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { BadgeMedal } from './BadgeMedal';
import { GlassCard, Text, useReduceMotion } from '../../../shared/ui';
import { FontFamily, Spacing, useTheme } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import type {
  BadgeOverview,
  BadgeView,
} from '../domain/useCases/GetBadgesUseCase';
import { badgeTitle, progressLabel } from './badgeLabels';

const SLOTS = 5;
const MEDAL_SIZE = 52;

/** Newest earned first, then the locked badges closest to done. */
function pickShelf(badges: BadgeView[]): BadgeView[] {
  const earned = badges
    .filter(b => b.earned)
    .sort((a, b) => (b.earnedOn ?? '').localeCompare(a.earnedOn ?? ''));
  const locked = badges
    .filter(b => !b.earned)
    .sort((a, b) => b.progress.ratio - a.progress.ratio);
  return [...earned, ...locked].slice(0, SLOTS);
}

function UpNextBar({ view }: { view: BadgeView }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const grow = useRef(new Animated.Value(reduceMotion ? view.progress.ratio : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      grow.setValue(view.progress.ratio);
      return;
    }
    const run = Animated.timing(grow, {
      toValue: view.progress.ratio,
      duration: 700,
      delay: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    run.start();
    return () => run.stop();
  }, [view.progress.ratio, reduceMotion, grow]);

  const width = grow.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  const trackStyle = { backgroundColor: theme.progressTrack };
  const fillStyle = { backgroundColor: theme.percent, width };

  return (
    <View style={styles.upNext}>
      <View style={styles.upNextText}>
        <Text variant="caption" color="secondary" numberOfLines={1} style={styles.upNextTitle}>
          {t('badges.shelf.upNext', { title: badgeTitle(view.definition, t) })}
        </Text>
        <Text variant="caption" color="secondary">
          {progressLabel(view, t)}
        </Text>
      </View>
      <View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
    </View>
  );
}

interface BadgeShelfProps {
  overview: Pick<BadgeOverview, 'badges' | 'earnedCount' | 'total' | 'upNext'>;
  onOpen: () => void;
}

/** Compact badge row for Home. Tapping anywhere opens the full list. */
export function BadgeShelf({ overview, onOpen }: BadgeShelfProps) {
  const { t } = useTranslation();
  const items = useMemo(() => pickShelf(overview.badges), [overview.badges]);

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={t('badges.shelf.a11y', {
        earned: overview.earnedCount,
        total: overview.total,
      })}
    >
      <GlassCard style={styles.card}>
        <View style={styles.head}>
          <Text variant="sectionTitle" color="primary">
            {t('nav.badges')}
          </Text>
          <Text variant="caption" color="secondary">
            {t('badges.shelf.count', {
              earned: overview.earnedCount,
              total: overview.total,
            })}
          </Text>
        </View>
        <View style={styles.row}>
          {items.map((b, i) => (
            <View key={b.definition.id} style={styles.slot}>
              <BadgeMedal
                glyph={b.definition.glyph}
                tier={b.definition.tier}
                size={MEDAL_SIZE}
                locked={!b.earned}
                progress={b.earned ? undefined : b.progress.ratio}
                enter="pop"
                enterDelay={120 + i * 70}
                shine={b.isNew ? 'loop' : 'none'}
              />
              <Text
                variant="micro"
                color={b.earned ? 'primary' : 'secondary'}
                numberOfLines={2}
                style={styles.slotLabel}
              >
                {badgeTitle(b.definition, t)}
              </Text>
            </View>
          ))}
        </View>
        {overview.upNext ? <UpNextBar view={overview.upNext} /> : null}
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing[3],
    marginBottom: Spacing[3],
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[2],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  slot: {
    width: MEDAL_SIZE + 8,
    alignItems: 'center',
    gap: Spacing[1],
  },
  slotLabel: {
    textAlign: 'center',
    fontFamily: FontFamily.medium,
  },
  upNext: {
    marginTop: Spacing[3],
    gap: Spacing[1],
  },
  upNextText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing[2],
  },
  upNextTitle: {
    flex: 1,
  },
  track: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
