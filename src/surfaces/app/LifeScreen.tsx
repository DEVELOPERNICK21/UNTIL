import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Text,
  ScreenGradient,
  Card,
  ProgressLine,
  CircularProgress,
} from '../../ui';
import { useObserveTimeState } from '../../hooks';
import { Spacing, Colors, getProgressColor } from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';

const RING_SIZE = Math.min(
  200,
  Dimensions.get('window').width - Spacing[4] * 2 - 32,
);

export function LifeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Life'>>();
  const { userProfile, timeState } = useObserveTimeState();
  const hasBirthDate = !!userProfile.birthDate;

  const progress = timeState.life ?? 0;
  const progressColor = getProgressColor(progress);
  const percentUsed = Math.round(progress * 100);
  const remainingDays = timeState.remainingDaysLife ?? 0;
  const deathAge = userProfile.deathAge ?? 80;
  const totalLifeDays = Math.round(deathAge * 365.25);
  const passedDays = totalLifeDays - remainingDays;

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text
            variant="sectionTitle"
            color="secondary"
            style={styles.overhead}
          >
            Your life
          </Text>

          {hasBirthDate ? (
            <>
              <View style={styles.ringWrap}>
                <CircularProgress
                  progress={progress}
                  size={RING_SIZE}
                  strokeWidth={12}
                  label={`${percentUsed}%`}
                />
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text
                    variant="caption"
                    color="secondary"
                    style={styles.statLabel}
                  >
                    DAYS LIVED
                  </Text>
                  <Text variant="title" color="primary" style={styles.bigValue}>
                    {passedDays.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text
                    variant="caption"
                    color="secondary"
                    style={styles.statLabel}
                  >
                    DAYS LEFT
                  </Text>
                  <Text
                    variant="title"
                    color="primary"
                    style={[styles.bigValue, { color: progressColor }]}
                  >
                    {remainingDays.toLocaleString()}
                  </Text>
                </View>
              </View>

              <Card style={styles.card}>
                <Text variant="body" color="secondary" style={styles.cardText}>
                  Based on {deathAge} years. {percentUsed}% used ·{' '}
                  {100 - percentUsed}% remaining.
                </Text>
                <ProgressLine
                  progress={progress}
                  fillColor={progressColor}
                  style={styles.progress}
                />
              </Card>
            </>
          ) : (
            <Card style={styles.card}>
              <Text variant="body" color="secondary" style={styles.cardText}>
                Set your birth date in Settings to see how much of your life has
                passed and how much is left.
              </Text>
              <TouchableOpacity
                style={styles.settingsCta}
                onPress={() => navigation.navigate('Settings')}
              >
                <Text variant="sectionTitle" color="primary">
                  Open Settings →
                </Text>
              </TouchableOpacity>
            </Card>
          )}
        </ScrollView>
      </ScreenGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[7],
  },
  overhead: {
    textAlign: 'center',
    marginBottom: Spacing[4],
    letterSpacing: 1.2,
  },
  ringWrap: {
    alignItems: 'center',
    marginBottom: Spacing[5],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing[4],
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    letterSpacing: 0.8,
    marginBottom: 4,
    fontSize: 11,
  },
  bigValue: {
    fontSize: 26,
    fontWeight: '700',
  },
  card: {
    marginBottom: Spacing[4],
  },
  cardText: {
    marginBottom: Spacing[2],
  },
  progress: {
    marginTop: Spacing[1],
  },
  settingsCta: {
    marginTop: Spacing[3],
    paddingVertical: Spacing[2],
  },
});
