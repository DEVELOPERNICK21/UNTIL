import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, ScreenGradient, Card, ProgressLine } from '../../ui';
import { useObserveTimeState } from '../../hooks';
import { Spacing, getProgressColor } from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { getDayProgress } from '../../core/time/day';
import { startOfDay, endOfDay } from '../../core/time/clock';

function getDaysInMonth(): number {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function getDaysInYear(): number {
  const y = new Date().getFullYear();
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365;
}

function formatDayPassedLeftWithSeconds(date: Date) {
  const day = getDayProgress(date);
  const start = startOfDay(date).getTime();
  const end = endOfDay(date).getTime();
  const passedMs = date.getTime() - start;
  const remainingMs = Math.max(0, end - date.getTime());
  const passedS = Math.floor(passedMs / 1000);
  const remainingS = Math.floor(remainingMs / 1000);
  const passedH = Math.floor(passedS / 3600);
  const passedM = Math.floor((passedS % 3600) / 60);
  const passedSec = passedS % 60;
  const leftH = Math.floor(remainingS / 3600);
  const leftM = Math.floor((remainingS % 3600) / 60);
  const leftSec = remainingS % 60;
  const passedStr = `${passedH}h ${passedM}m ${passedSec}s`;
  const leftStr = `${leftH}h ${leftM}m ${leftSec}s`;
  const passedPct = Math.round(day.progress * 100);
  const leftPct = 100 - passedPct;
  return { passedStr, leftStr, passedPct, leftPct, progress: day.progress };
}

function formatMonthPassedLeft(remainingDaysMonth: number) {
  const daysInMonth = getDaysInMonth();
  const passedDays = daysInMonth - remainingDaysMonth;
  const passedPct = Math.round((passedDays / daysInMonth) * 100);
  const leftPct = 100 - passedPct;
  return {
    passedDays,
    leftDays: remainingDaysMonth,
    passedPct,
    leftPct,
  };
}

function formatYearPassedLeft(remainingDaysYear: number) {
  const daysInYear = getDaysInYear();
  const passedDays = daysInYear - remainingDaysYear;
  const passedPct = Math.round((passedDays / daysInYear) * 100);
  const leftPct = 100 - passedPct;
  return {
    passedDays,
    leftDays: remainingDaysYear,
    passedPct,
    leftPct,
  };
}

function formatLifePassedLeft(
  lifeProgress: number,
  remainingDaysLife: number | undefined,
  deathAge: number
) {
  const totalLifeDays = Math.round(deathAge * 365.25);
  const remaining = remainingDaysLife ?? 0;
  const passedDays = totalLifeDays - remaining;
  const passedPct = Math.round(lifeProgress * 100);
  const leftPct = 100 - passedPct;
  return {
    passedDays,
    leftDays: remaining,
    passedPct,
    leftPct,
    totalLifeDays,
  };
}

interface BlockProps {
  title: string;
  passedLabel: string;
  leftLabel: string;
  progress: number;
  passedPct: number;
  leftPct: number;
  index?: number;
}

const GLOW_RADIUS_LEFT = 12;

function leftValueGlowStyle(hexColor: string) {
  return {
    color: hexColor,
    textShadowColor: hexColor,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: GLOW_RADIUS_LEFT,
  };
}

function TimeBlock({ title, passedLabel, leftLabel, progress, passedPct, leftPct, index = 0 }: BlockProps) {
  const progressColor = getProgressColor(progress);
  // Left: small left → red, big left → green (same scale as progress: 0=green, 1=red)
  const leftColor = getProgressColor(progress);
  const opacity = useRef(new Animated.Value(0)).current;
  const blinkOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 420,
      delay: 60 + index * 50,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [opacity, index]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkOpacity, {
          toValue: 0.72,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(blinkOpacity, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [blinkOpacity]);

  return (
    <Animated.View style={{ opacity }}>
      <Card style={styles.block}>
        <Text variant="sectionTitle" color="secondary" style={styles.blockTitle}>
          {title}
        </Text>
        <View style={styles.row}>
          <View style={styles.half}>
            <Text variant="title" color="primary" style={styles.value}>
              {passedLabel}
            </Text>
            <Text variant="caption" color="secondary">passed</Text>
          </View>
          <View style={[styles.half, styles.halfRight]}>
            <Animated.View style={{ opacity: blinkOpacity }}>
              <Text variant="title" style={[styles.value, leftValueGlowStyle(leftColor)]}>
                {leftLabel}
              </Text>
            </Animated.View>
            <Text variant="caption" color="secondary">left</Text>
          </View>
        </View>
        <View style={styles.percentRow}>
          <Text variant="caption" color="secondary" style={styles.percentLine}>
            {passedPct}% passed · {leftPct}% left
          </Text>
        </View>
        <ProgressLine progress={progress} fillColor={progressColor} style={styles.progress} />
      </Card>
    </Animated.View>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();
  const { userProfile, timeState } = useObserveTimeState();
  const [liveNow, setLiveNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setLiveNow(new Date());
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const remainingDaysMonth = timeState.remainingDaysMonth ?? 0;
  const remainingDaysYear = timeState.remainingDaysYear ?? 0;

  const day = formatDayPassedLeftWithSeconds(liveNow);
  const month = formatMonthPassedLeft(remainingDaysMonth);
  const year = formatYearPassedLeft(remainingDaysYear);
  const life = formatLifePassedLeft(
    timeState.life,
    timeState.remainingDaysLife,
    userProfile.deathAge ?? 80
  );
  const hasBirthDate = !!userProfile.birthDate;

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text variant="large" color="primary" style={styles.headline}>
            Time reality
          </Text>
          <Text variant="body" color="secondary" style={styles.subhead}>
            Passed and left — one place.
          </Text>

          <TimeBlock
            index={0}
            title="Today"
            passedLabel={day.passedStr}
            leftLabel={day.leftStr}
            progress={day.progress}
            passedPct={day.passedPct}
            leftPct={day.leftPct}
          />

          <TimeBlock
            index={1}
            title="This month"
            passedLabel={`${month.passedDays} days`}
            leftLabel={`${month.leftDays} days`}
            progress={timeState.month}
            passedPct={month.passedPct}
            leftPct={month.leftPct}
          />

          <TimeBlock
            index={2}
            title="This year"
            passedLabel={`${year.passedDays} days`}
            leftLabel={`${year.leftDays} days`}
            progress={timeState.year}
            passedPct={year.passedPct}
            leftPct={year.leftPct}
          />

          {hasBirthDate ? (
            <TimeBlock
              index={3}
              title="Your life"
              passedLabel={`${life.passedDays.toLocaleString()} days`}
              leftLabel={`${life.leftDays.toLocaleString()} days`}
              progress={timeState.life}
              passedPct={life.passedPct}
              leftPct={life.leftPct}
            />
          ) : (
            <Card style={styles.block}>
              <Text variant="sectionTitle" color="secondary" style={styles.blockTitle}>
                Your life
              </Text>
              <Text variant="body" color="secondary" style={styles.lifePrompt}>
                Set birth date in Settings to see how much life has passed and how much is left.
              </Text>
              <Text
                variant="caption"
                color="primary"
                style={styles.settingsLink}
                onPress={() => navigation.navigate('Settings')}
              >
                Open Settings
              </Text>
            </Card>
          )}
        </ScrollView>
      </ScreenGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingTop: Spacing[4],
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[7],
  },
  headline: {
    marginBottom: Spacing[2],
    fontWeight: '600',
  },
  subhead: {
    marginBottom: Spacing[5],
  },
  block: {
    marginBottom: Spacing[4],
  },
  blockTitle: {
    marginBottom: Spacing[3],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    marginBottom: Spacing[2],
  },
  half: {
    flex: 1,
  },
  halfRight: {
    alignItems: 'flex-end',
  },
  value: {
    marginBottom: 2,
  },
  percentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing[2],
    alignItems: 'baseline',
  },
  percentLine: {
    marginRight: 2,
  },
  progress: {
    marginTop: Spacing[1],
  },
  lifePrompt: {
    marginBottom: Spacing[2],
  },
  settingsLink: {
    textDecorationLine: 'underline',
  },
});