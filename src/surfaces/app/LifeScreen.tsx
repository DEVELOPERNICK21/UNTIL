import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, ScreenGradient, GlassCard, LifeWeeksGrid } from '../../ui';
import { PeriodDetailScreen } from './PeriodDetailScreen';
import {
  useObserveTimeState,
  useAccessControl,
  useTrackLifeScreenVisit,
  useLifeUnlockPaywallPrompt,
  usePresenceStreak,
  useLifeWeeks,
} from '../../hooks';
import { LifeUnlockEndedModal } from '../../components/premium/LifeUnlockEndedModal';
import { Spacing, useTheme } from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';

export function LifeScreen() {
  useTrackLifeScreenVisit();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Life'>>();
  const { userProfile, timeState } = useObserveTimeState();
  const { canAccessLife } = useAccessControl();
  const { streak } = usePresenceStreak();
  const theme = useTheme();
  const { totalWeeks, livedWeeks, renderWeeks } = useLifeWeeks(
    userProfile.deathAge,
    timeState.remainingDaysLife,
  );
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
  const livedWeeksLabel = livedWeeks.toLocaleString();
  const totalWeeksLabel = totalWeeks.toLocaleString();

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
              Your life
            </Text>
            {streak.count > 0 ? (
              <Text variant="caption" color="secondary" style={styles.streakHint}>
                {streak.count}-day presence · Ember is with you
              </Text>
            ) : (
              <Text variant="caption" color="secondary" style={styles.streakHint}>
                Ember has a tip for you below
              </Text>
            )}
            <GlassCard style={styles.card}>
              <Text variant="body" color="secondary" style={styles.cardText}>
                {!hasBirthDate
                  ? 'Set your birth date in Settings to see how much of your life has passed and how much is left.'
                  : 'Life details are part of Premium (or your free app preview). Visiting this screen can unlock Life for 24 hours after enough app opens. Pull to leave and return if you just unlocked.'}
              </Text>
              <TouchableOpacity
                style={styles.settingsCta}
                onPress={() =>
                  navigation.navigate(!hasBirthDate ? 'Settings' : 'Premium')
                }
              >
                <Text variant="sectionTitle" color="primary">
                  {!hasBirthDate ? 'Open Settings →' : 'Unlock Premium →'}
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
        title="Your life"
        progress={progress}
        passedLabel={passedDays.toLocaleString()}
        leftLabel={remainingDays.toLocaleString()}
        passedCaption="Days lived"
        leftCaption="Days left"
        summary={`Based on ${deathAge} years. ${percentUsed}% used · ${100 - percentUsed}% remaining.`}
        hero={
          <View style={styles.hero}>
            <Text variant="body" color="primary" style={styles.heroIntro}>
              You have lived
            </Text>
            <Text style={[styles.heroWeeks, { color: theme.percent }]}>
              {livedWeeksLabel} weeks / {totalWeeksLabel} weeks
            </Text>
            <LifeWeeksGrid
              livedWeeks={livedWeeks}
              renderWeeks={renderWeeks}
              fillColor={theme.percent}
            />
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
});
