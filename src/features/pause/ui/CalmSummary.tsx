import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Radius, Spacing } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { parseDate } from '../../../shared/time/clock';
import { calmMinutes, goalReached, type LevelInfo } from '../domain/pauseProgress';
import { CalmText } from './CalmText';
import { CALM } from './calmPalette';
import { LEVEL_LABEL } from './practiceLabels';

const RING = 92;
const STROKE = 8;

interface Props {
  todaySeconds: number;
  goalSeconds: number;
  level: LevelInfo;
  week: Array<{ date: string; practised: boolean; isToday: boolean }>;
}

/**
 * "Your calm": today's minutes against a small daily goal, the level (which only goes up), and the
 * days of this week you practised. It never counts days in a row and never takes anything back.
 */
export function CalmSummary({ todaySeconds, goalSeconds, level, week }: Props) {
  const { t, formatDate } = useTranslation();
  const reached = goalReached(todaySeconds);
  const progress = reached ? 1 : Math.min(1, todaySeconds / goalSeconds);
  const radius = (RING - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={{ width: RING, height: RING }}>
          <Svg width={RING} height={RING}>
            <Circle cx={RING / 2} cy={RING / 2} r={radius} stroke={CALM.track} strokeWidth={STROKE} fill="none" />
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={radius}
              stroke={reached ? CALM.warm : CALM.accent}
              strokeWidth={STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={circumference * (1 - progress)}
              rotation={-90}
              origin={`${RING / 2}, ${RING / 2}`}
            />
          </Svg>
          <View style={styles.ringText} pointerEvents="none">
            <CalmText variant="title" tone="primary">
              {calmMinutes(todaySeconds)}
            </CalmText>
          </View>
        </View>

        <View style={styles.right}>
          <CalmText variant="caption" tone="muted">
            {t('pause.hub.today')}
          </CalmText>
          <CalmText variant="body" tone="primary" accessibilityLiveRegion="polite">
            {t('pause.hub.todayValue', {
              minutes: calmMinutes(todaySeconds),
              goal: Math.round(goalSeconds / 60),
            })}
          </CalmText>

          <CalmText variant="sectionTitle" tone="accent" style={styles.levelName}>
            {t(LEVEL_LABEL[level.id])}
          </CalmText>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${Math.round(level.progress * 100)}%` }]} />
          </View>
          <CalmText variant="micro" tone="muted">
            {level.next
              ? t('pause.hub.nextLevel', {
                  minutes: Math.ceil(level.secondsToNext / 60),
                  level: t(LEVEL_LABEL[level.next]),
                })
              : t('pause.hub.topLevel')}
          </CalmText>
        </View>
      </View>

      <CalmText variant="caption" tone="muted" style={styles.weekLabel}>
        {t('pause.hub.week')}
      </CalmText>
      <View style={styles.week}>
        {week.map(day => (
          <View key={day.date} style={styles.dayCol}>
            <View
              style={[styles.day, day.practised && styles.dayDone, day.isToday && styles.dayToday]}
              accessibilityLabel={`${formatDate(parseDate(day.date), { weekday: 'long' })}${day.practised ? ' ✓' : ''}`}
            />
            <CalmText variant="micro" tone={day.isToday ? 'accent' : 'muted'}>
              {formatDate(parseDate(day.date), { weekday: 'narrow' })}
            </CalmText>
          </View>
        ))}
      </View>

      <CalmText variant="micro" tone="muted" style={styles.reassure}>
        {t('pause.hub.reassure')}
      </CalmText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CALM.card,
    borderColor: CALM.cardBorder,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing[3],
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  ringText: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    flex: 1,
  },
  levelName: {
    marginTop: Spacing[2],
  },
  bar: {
    height: 5,
    borderRadius: 3,
    backgroundColor: CALM.track,
    overflow: 'hidden',
    marginVertical: 6,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: CALM.accent,
  },
  weekLabel: {
    marginTop: Spacing[3],
    marginBottom: Spacing[1],
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
    gap: 4,
  },
  day: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: CALM.cardBorder,
    backgroundColor: 'transparent',
  },
  dayDone: {
    backgroundColor: CALM.orb,
    borderColor: CALM.accent,
  },
  dayToday: {
    borderColor: CALM.accent,
    borderWidth: 1.6,
  },
  reassure: {
    marginTop: Spacing[3],
    textAlign: 'center',
  },
});
