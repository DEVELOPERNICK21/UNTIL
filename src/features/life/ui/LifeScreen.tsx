import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, ScreenGradient, GlassCard, LifeWeeksGrid } from '../../../shared/ui';
import { PeriodDetailScreen, useObserveTimeState } from '../../time';
import { useAccessControl, LifeUnlockEndedModal } from '../../premium';
import { useTrackLifeScreenVisit } from '../hooks/useTrackLifeScreenVisit';
import {
  useLifeUnlockPaywallPrompt,
} from '../hooks/useLifeUnlockPaywallPrompt';
import { usePresenceStreak } from '../../presence';
import { useLifeWeeks } from '../../../shared/hooks/useLifeWeeks';
import { Spacing, useTheme } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import type { RootStackParamList } from '../../../shared/navigation/types';

export function LifeScreen() {
  useTrackLifeScreenVisit();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Life'>>();
  const { userProfile, timeState } = useObserveTimeState();
  const { canAccessLife } = useAccessControl();
  const { streak } = usePresenceStreak();
  const theme = useTheme();
  const { t, formatNumber } = useTranslation();
  const { totalWeeks, livedWeeks, renderWeeks, renderLivedWeeks } = useLifeWeeks(
    userProfile.deathAge,
    timeState.remainingDaysLife,
  );
  // Let the stack push finish before building the weeks canvas.
  const [gridReady, setGridReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) setGridReady(true);
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);
  const {
    visible: lifeUnlockPaywallVisible,
    dismiss: dismissLifeUnlockPaywall,
  } = useLifeUnlockPaywallPrompt(true);
  const hasBirthDate = !!userProfile.birthDate;

  const progress = timeState.life ?? 0;
  const percentUsed = Math.round(progress * 100);
  const remainingDays = timeState.remainingDaysLife ?? 0;
  const deathAge = userProfile.deathAge ?? 80;
  const totalLifeDays = Math.round(deathAge * 365.25);
  const passedDays = totalLifeDays - remainingDays;

  if (!hasBirthDate || !canAccessLife) {
    return (
      <View style={styles.container}>
        <LifeUnlockEndedModal
          visible={lifeUnlockPaywallVisible}
          onDismiss={dismissLifeUnlockPaywall}
        />
        <ScreenGradient>
          <View style={styles.lockedPad}>
            <Text
              variant="sectionTitle"
              color="secondary"
              style={styles.overhead}
            >
              {t('nav.life')}
            </Text>
            {streak.count > 0 ? (
              <Text variant="caption" color="secondary" style={styles.streakHint}>
                {t('detail.life.streakHint', { days: streak.count })}
              </Text>
            ) : (
              <Text variant="caption" color="secondary" style={styles.streakHint}>
                {t('detail.life.tipHint')}
              </Text>
            )}
            <GlassCard style={styles.card}>
              <Text variant="body" color="secondary" style={styles.cardText}>
                {!hasBirthDate
                  ? t('detail.life.needBirthDate')
                  : t('detail.life.locked')}
              </Text>
              <TouchableOpacity
                style={styles.settingsCta}
                onPress={() =>
                  navigation.navigate(!hasBirthDate ? 'Settings' : 'Premium')
                }
              >
                <Text variant="sectionTitle" color="primary">
                  {!hasBirthDate
                    ? t('detail.life.openSettings')
                    : t('detail.life.unlockPremium')}
                </Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
        </ScreenGradient>
      </View>
    );
  }

  return (
    <>
      <LifeUnlockEndedModal
        visible={lifeUnlockPaywallVisible}
        onDismiss={dismissLifeUnlockPaywall}
      />
      <PeriodDetailScreen
        kind="life"
        title={t('nav.life')}
        progress={progress}
        passedLabel={formatNumber(passedDays)}
        leftLabel={formatNumber(remainingDays)}
        passedCaption={t('detail.daysLived')}
        leftCaption={t('detail.daysLeft')}
        summary={t('detail.life.summary', {
          years: deathAge,
          used: percentUsed,
          left: 100 - percentUsed,
        })}
        hero={
          <View style={styles.hero}>
            <Text variant="body" color="primary" style={styles.heroIntro}>
              {t('detail.life.intro')}
            </Text>
            <Text style={[styles.heroWeeks, { color: theme.percent }]}>
              {t('detail.life.weeks', {
                lived: formatNumber(livedWeeks),
                total: formatNumber(totalWeeks),
              })}
            </Text>
            {gridReady ? (
              <LifeWeeksGrid
                livedWeeks={renderLivedWeeks}
                renderWeeks={renderWeeks}
                fillColor={theme.percent}
              />
            ) : (
              <View style={styles.gridPlaceholder} />
            )}
          </View>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  lockedPad: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
  },
  overhead: {
    textAlign: 'center',
    marginBottom: Spacing[1],
    letterSpacing: 0.4,
  },
  streakHint: {
    textAlign: 'center',
    letterSpacing: 0.4,
    marginBottom: Spacing[4],
  },
  card: {
    marginBottom: Spacing[4],
  },
  cardText: {
    marginBottom: Spacing[2],
  },
  settingsCta: {
    marginTop: Spacing[3],
    paddingVertical: Spacing[2],
  },
  hero: {
    width: '100%',
    alignItems: 'center',
  },
  heroIntro: {
    textAlign: 'center',
  },
  heroWeeks: {
    textAlign: 'center',
    marginBottom: Spacing[5],
  },
  gridPlaceholder: {
    width: '100%',
    minHeight: 180,
  },
});
