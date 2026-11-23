import React, { useCallback } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Radius, Spacing } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { now } from '../../../shared/time/clock';
import type { RootStackParamList } from '../../../shared/navigation/types';
import { MILESTONE_IDS } from '../domain/pauseProgress';
import {
  PRACTICES,
  QUICK_RELIEF,
  dayPartOf,
  recommendFor,
  type DayPart,
  type PracticeId,
} from '../domain/practices';
import { usePauseProgress } from '../hooks/usePauseProgress';
import { CalmBackdrop } from './CalmBackdrop';
import { CalmSummary } from './CalmSummary';
import { CalmText } from './CalmText';
import { Medal } from './Medal';
import { PracticeCard } from './PracticeCard';
import { CALM } from './calmPalette';
import { MILESTONE_LABEL } from './practiceLabels';
import type { TranslationKey } from '../../../shared/i18n/translate';

const GREETING: Record<DayPart, TranslationKey> = {
  morning: 'pause.hub.greeting.morning',
  afternoon: 'pause.hub.greeting.afternoon',
  evening: 'pause.hub.greeting.evening',
  night: 'pause.hub.greeting.night',
};

type Nav = NativeStackNavigationProp<RootStackParamList, 'Pause'>;

/**
 * The Pause menu. The panic button is the first thing on it: "I need calm now" starts a one-minute
 * practice at once. Below it, a pick that suits the hour, your calm minutes, every practice (none is
 * locked: a calming tool that has to be earned is no use in a bad moment) and your milestones.
 */
export function PauseHubScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { progress, todaySeconds, goalSeconds, level, week } = usePauseProgress();
  const hour = now().getHours();

  const open = useCallback(
    (practice: PracticeId, instant = false) => navigation.navigate('PauseSession', { practice, instant }),
    [navigation],
  );
  const close = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Home');
  }, [navigation]);

  return (
    <CalmBackdrop>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing[2], paddingBottom: Math.max(insets.bottom, Spacing[3]) + Spacing[5] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={close}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('pause.close.a11y')}
          style={styles.closeButton}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M6 6l12 12M18 6L6 18" stroke={CALM.textSecondary} strokeWidth={1.8} strokeLinecap="round" />
          </Svg>
        </Pressable>

        <CalmText variant="headline" tone="primary" accessibilityRole="header">
          {t(GREETING[dayPartOf(hour)])}
        </CalmText>
        <CalmText variant="body" tone="secondary" style={styles.subtitle}>
          {t('pause.hub.subtitle')}
        </CalmText>

        <Pressable
          onPress={() => open(QUICK_RELIEF, true)}
          accessibilityRole="button"
          accessibilityLabel={`${t('pause.hub.quick.title')}. ${t('pause.hub.quick.body')}`}
          style={({ pressed }) => [styles.quick, pressed && styles.pressed]}
        >
          <View style={styles.quickOrb}>
            <View style={styles.quickOrbHalo} />
            <View style={styles.quickOrbCore} />
          </View>
          <View style={styles.quickText}>
            <CalmText variant="sectionTitle" tone="primary">
              {t('pause.hub.quick.title')}
            </CalmText>
            <CalmText variant="caption" tone="secondary">
              {t('pause.hub.quick.body')}
            </CalmText>
          </View>
        </Pressable>

        <CalmText variant="caption" tone="muted" style={styles.section}>
          {t('pause.hub.forNow')}
        </CalmText>
        <PracticeCard practice={recommendFor(hour)} featured onPress={() => open(recommendFor(hour))} />

        <CalmText variant="caption" tone="muted" style={styles.section}>
          {t('pause.hub.yourCalm')}
        </CalmText>
        <CalmSummary todaySeconds={todaySeconds} goalSeconds={goalSeconds} level={level} week={week} />

        <CalmText variant="caption" tone="muted" style={styles.section}>
          {t('pause.hub.all')}
        </CalmText>
        <View style={styles.list}>
          {PRACTICES.map(practice => (
            <PracticeCard key={practice.id} practice={practice.id} onPress={() => open(practice.id)} />
          ))}
        </View>

        <CalmText variant="caption" tone="muted" style={styles.section}>
          {t('pause.hub.milestones')}
        </CalmText>
        <View style={styles.medals}>
          {MILESTONE_IDS.map(id => {
            const earned = progress.earned.includes(id);
            return (
              <View
                key={id}
                style={styles.medal}
                accessible
                accessibilityLabel={`${t(MILESTONE_LABEL[id])}. ${earned ? t('pause.ms.earned') : t('pause.ms.locked')}`}
              >
                <Medal id={id} earned={earned} />
                <CalmText variant="micro" tone={earned ? 'secondary' : 'muted'} style={styles.medalLabel} numberOfLines={2}>
                  {t(MILESTONE_LABEL[id])}
                </CalmText>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </CalmBackdrop>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing[4],
  },
  closeButton: {
    alignSelf: 'flex-start',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -Spacing[2],
    marginBottom: Spacing[1],
  },
  subtitle: {
    marginTop: Spacing[1],
    marginBottom: Spacing[4],
  },
  quick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: CALM.accent,
    backgroundColor: CALM.cardSelected,
    padding: Spacing[3],
  },
  pressed: {
    opacity: 0.8,
  },
  quickOrb: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickOrbHalo: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: CALM.orb,
    opacity: 0.22,
  },
  quickOrbCore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: CALM.orb,
    opacity: 0.85,
  },
  quickText: {
    flex: 1,
  },
  section: {
    marginTop: Spacing[4],
    marginBottom: Spacing[2],
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  list: {
    gap: Spacing[2],
  },
  medals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
  },
  medal: {
    width: 76,
    alignItems: 'center',
  },
  medalLabel: {
    marginTop: 4,
    textAlign: 'center',
  },
});
