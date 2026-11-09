import React, { useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, GlassCard } from '../../../shared/ui';
import { useAccessControl } from '../../premium';
import { useInterventionState } from '../hooks/useInterventionState';
import { useObserveCategoryTotals } from '../hooks/useObserveCategoryTotals';
import { useLogActivity } from '../hooks/useLogActivity';
import { useDailyNothingLimit } from '../hooks/useDailyNothingLimit';
import { Spacing, Radius, useTheme, getFontFamilyForWeight, Weight } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import type { t as translateFn } from '../../../shared/i18n/translate';
import type { RootStackParamList } from '../../../shared/navigation/types';
import { logAnalyticsEvent } from '../../../shared/analytics/analytics';

function formatHours(hours: number, t: typeof translateFn): string {
  if (hours < 1) {
    return t('activity.duration.minutes', { m: Math.round(hours * 60) });
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return t('activity.duration.hours', { h });
  return t('activity.duration.both', { h, m });
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function InterventionHomeCard() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { hasPremiumBundle } = useAccessControl();
  const intervention = useInterventionState();
  const totals = useObserveCategoryTotals();
  const { limitHours } = useDailyNothingLimit();
  const { startCategory, endCurrent, addPastBlock } = useLogActivity();

  const nothingHours = totals.today.nothing;
  const trackingNothing = totals.currentCategory === 'nothing';
  const limitCrossed = intervention.limitCrossed;
  const remainingBeforeAlert = Math.max(0, limitHours - nothingHours);

  const goPremium = useCallback(() => {
    void logAnalyticsEvent('intervention_teaser_tap');
    navigation.navigate('Premium');
  }, [navigation]);

  const handleToggleTrack = useCallback(() => {
    if (trackingNothing) {
      endCurrent();
      void logAnalyticsEvent('intervention_stop_tracking');
    } else {
      startCategory('nothing');
      void logAnalyticsEvent('intervention_start_tracking');
    }
  }, [trackingNothing, endCurrent, startCategory]);

  const handleQuickAdd = useCallback(
    (minutes: number) => {
      addPastBlock('nothing', minutes);
      void logAnalyticsEvent('intervention_quick_log', { minutes });
    },
    [addPastBlock]
  );

  if (!hasPremiumBundle) {
    return (
      <GlassCard style={styles.card}>
        <View style={styles.headerRow}>
          <Text variant="caption" color="secondary" style={styles.eyebrow}>
            {t('activity.locked.eyebrow')}
          </Text>
          <TouchableOpacity onPress={goPremium} hitSlop={8} activeOpacity={0.85}>
            <Text variant="caption" style={{ color: theme.percent }}>
              {t('activity.locked.unlock')}
            </Text>
          </TouchableOpacity>
        </View>
        <Text variant="caption" color="secondary" numberOfLines={2} style={styles.hint}>
          {t('activity.locked.hint')}
        </Text>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={styles.card}>
      <View style={styles.headerRow}>
        <Text variant="caption" color="secondary" style={styles.eyebrow}>
          {t('activity.today.eyebrow')}
        </Text>
        <Text variant="caption" style={{ color: theme.percent }}>
          {formatHours(nothingHours, t)} / {formatHours(limitHours, t)}
        </Text>
      </View>

      {limitCrossed && intervention.message ? (
        <Text
          variant="caption"
          numberOfLines={2}
          style={{
            color: '#D4786A',
            fontFamily: getFontFamilyForWeight(Weight.semibold),
          }}
        >
          {intervention.message}
        </Text>
      ) : (
        <Text variant="caption" color="secondary" numberOfLines={1} style={styles.hint}>
          {trackingNothing
            ? t('activity.hint.tracking')
            : remainingBeforeAlert > 0
              ? t('activity.hint.remaining', {
                  time: formatHours(remainingBeforeAlert, t),
                })
              : t('activity.hint.idle')}
        </Text>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            {
              borderColor: trackingNothing ? theme.percent : theme.glassBorder,
              backgroundColor: trackingNothing
                ? 'rgba(232, 124, 32, 0.14)'
                : 'rgba(255, 255, 255, 0.04)',
            },
          ]}
          onPress={handleToggleTrack}
          activeOpacity={0.8}
          accessibilityLabel={
            trackingNothing
              ? t('activity.track.stopLabel')
              : t('activity.track.startLabel')
          }
        >
          <Text
            variant="caption"
            style={{
              color: theme.textPrimary,
              fontFamily: getFontFamilyForWeight(Weight.medium),
            }}
          >
            {trackingNothing
              ? t('activity.track.stop')
              : t('activity.track.start')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            {
              borderColor: theme.glassBorder,
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
            },
          ]}
          onPress={() => handleQuickAdd(30)}
          activeOpacity={0.8}
        >
          <Text variant="caption" color="secondary">
            {t('activity.add30')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            {
              borderColor: theme.glassBorder,
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
            },
          ]}
          onPress={() => handleQuickAdd(60)}
          activeOpacity={0.8}
        >
          <Text variant="caption" color="secondary">
            {t('activity.add60')}
          </Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing[3],
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    gap: Spacing[2],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    letterSpacing: 0.3,
  },
  hint: {
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: Spacing[2],
    borderRadius: Radius.md,
    borderWidth: 1,
  },
});
