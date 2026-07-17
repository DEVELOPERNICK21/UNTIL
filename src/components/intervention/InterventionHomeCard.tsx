import React, { useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, GlassCard, ProgressLine } from '../../ui';
import {
  useAccessControl,
  useInterventionState,
  useObserveCategoryTotals,
  useLogActivity,
  useDailyNothingLimit,
} from '../../hooks';
import { Spacing, Radius, useTheme, getFontFamilyForWeight, Weight } from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { logAnalyticsEvent } from '../../services/analytics';

function formatHours(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function InterventionHomeCard() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { hasPremiumBundle } = useAccessControl();
  const intervention = useInterventionState();
  const totals = useObserveCategoryTotals();
  const { limitHours } = useDailyNothingLimit();
  const { startCategory, endCurrent, addPastBlock } = useLogActivity();

  const nothingHours = totals.today.nothing;
  const trackingNothing = totals.currentCategory === 'nothing';
  const progress = limitHours > 0 ? Math.min(1, nothingHours / limitHours) : 0;
  const limitCrossed = intervention.limitCrossed;
  const overLimitHours = Math.max(0, nothingHours - limitHours);
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
            PREMIUM
          </Text>
          <View style={[styles.pill, { borderColor: theme.divider }]}>
            <Text variant="micro" color="secondary">
              Locked
            </Text>
          </View>
        </View>
        <Text variant="title" style={{ color: theme.textPrimary }}>
          Lost-time alerts
        </Text>
        <Text variant="body" color="secondary" style={styles.body}>
          Log wasted hours and get a red moment when you cross your daily limit —
          &quot;This day will never repeat.&quot;
        </Text>
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: theme.percent }]}
          onPress={goPremium}
          activeOpacity={0.85}
        >
          <Text
            variant="body"
            style={{
              color: '#0E0E10',
              fontFamily: getFontFamilyForWeight(Weight.semibold),
            }}
          >
            Unlock intervention alerts
          </Text>
        </TouchableOpacity>
      </GlassCard>
    );
  }

  return (
    <GlassCard
      style={[
        styles.card,
        limitCrossed && {
          borderColor: 'rgba(220, 60, 60, 0.55)',
          borderWidth: 1,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text variant="caption" color="secondary" style={styles.eyebrow}>
          TODAY&apos;S LOST TIME
        </Text>
        <Text variant="caption" style={{ color: theme.percent }}>
          {formatHours(nothingHours)} / {formatHours(limitHours)}
        </Text>
      </View>

      <ProgressLine
        progress={progress}
        fillColor={limitCrossed ? '#DC3C3C' : theme.percent}
        style={styles.progressLine}
      />

      {limitCrossed && intervention.message ? (
        <View
          style={[
            styles.alert,
            { backgroundColor: 'rgba(220, 60, 60, 0.12)' },
          ]}
        >
          <Text
            variant="body"
            style={{
              color: '#E85C5C',
              fontFamily: getFontFamilyForWeight(Weight.semibold),
              textAlign: 'center',
            }}
          >
            {intervention.message}
          </Text>
          {overLimitHours > 0 ? (
            <Text
              variant="caption"
              color="secondary"
              style={styles.overLimitHint}
            >
              {formatHours(overLimitHours)} over your {formatHours(limitHours)} limit
            </Text>
          ) : null}
        </View>
      ) : (
        <Text variant="caption" color="secondary" style={styles.hint}>
          {trackingNothing
            ? 'Tracking wasted time now — tap Stop when you refocus.'
            : remainingBeforeAlert > 0
              ? `${formatHours(remainingBeforeAlert)} left before the red alert.`
              : 'Log scroll / doom time so UNTIL can nudge you before the day is gone.'}
        </Text>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            {
              borderColor: trackingNothing ? theme.percent : theme.divider,
              backgroundColor: trackingNothing
                ? 'rgba(232, 124, 32, 0.14)'
                : 'transparent',
            },
          ]}
          onPress={handleToggleTrack}
          activeOpacity={0.8}
        >
          <Text
            variant="caption"
            style={{
              color: theme.textPrimary,
              fontFamily: getFontFamilyForWeight(Weight.medium),
            }}
          >
            {trackingNothing ? 'Stop tracking' : 'Track wasted time'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: theme.divider }]}
          onPress={() => handleQuickAdd(30)}
          activeOpacity={0.8}
        >
          <Text variant="caption" color="secondary">
            +30m
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: theme.divider }]}
          onPress={() => handleQuickAdd(60)}
          activeOpacity={0.8}
        >
          <Text variant="caption" color="secondary">
            +1h
          </Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing[4],
    padding: Spacing[4],
    gap: Spacing[3],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    letterSpacing: 1.2,
  },
  pill: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radius.full ?? 999,
    borderWidth: 1,
  },
  body: {
    lineHeight: 22,
  },
  hint: {
    lineHeight: 18,
  },
  progressLine: {
    alignSelf: 'stretch',
    width: '100%',
  },
  alert: {
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.md,
    gap: Spacing[1],
  },
  overLimitHint: {
    textAlign: 'center',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing[2],
    flexWrap: 'wrap',
  },
  actionBtn: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  cta: {
    marginTop: Spacing[1],
    paddingVertical: Spacing[3],
    borderRadius: Radius.md,
    alignItems: 'center',
  },
});
