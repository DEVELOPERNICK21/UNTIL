import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Text,
  ScreenGradient,
  GlassCard,
  ProgressLine,
  PeriodGlyph,
  Ember,
} from '../../ui';
import type { PeriodGlyphKind } from '../../ui';
import {
  useObserveTimeState,
  useGoalsFeatureEnabled,
  useAccessControl,
  useReduceMotion,
  usePresenceStreak,
  useDailyReflection,
} from '../../hooks';
import {
  Spacing,
  FontFamily,
  getProgressColor,
  useTheme,
  Shadows,
  feelForPeriod,
  homeHeroSupport,
  timeOfDayLabel,
} from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { logAnalyticsEvent } from '../../services/analytics';
import { setEmberRouteOverride } from '../../services/emberSurface';
import { TaskReportContent } from './TaskReportContent';
import { InterventionHomeCard } from '../../components/intervention/InterventionHomeCard';
import { TimeCoachCard } from '../../components/reflections/TimeCoachCard';

function getDaysInMonth(): number {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function getDaysInYear(): number {
  const y = new Date().getFullYear();
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365;
}

function formatDayPassedLeftWithSeconds(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  const passedMs = date.getTime() - start.getTime();
  const remainingMs = Math.max(0, end.getTime() - date.getTime());
  const totalMs = Math.max(1, end.getTime() - start.getTime());
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
  const progress = Math.min(1, Math.max(0, passedMs / totalMs));
  const passedPct = Math.round(progress * 100);
  const leftPct = 100 - passedPct;
  return { passedStr, leftStr, passedPct, leftPct, progress };
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
  deathAge: number,
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
  glyph: PeriodGlyphKind;
  passedLabel: string;
  leftLabel: string;
  progress: number;
  passedPct: number;
  leftPct: number;
  index?: number;
  scrollY?: Animated.Value;
  reduceMotion?: boolean;
  onPress?: () => void;
}

function scrollRevealStyle(
  scrollY: Animated.Value | undefined,
  index: number,
) {
  if (!scrollY) {
    return undefined;
  }
  // Motion only — no opacity fade (kept cards uneven / washed out down the list).
  const mid = Math.max(0, index * 72) + 90;
  return {
    transform: [
      {
        translateY: scrollY.interpolate({
          inputRange: [0, mid, mid + 160],
          outputRange: [0, -4 * Math.min(index, 2) * 0.35, -8],
          extrapolate: 'clamp' as const,
        }),
      },
    ],
  };
}

const TimeBlock = React.memo(function TimeBlock({
  title,
  glyph,
  passedLabel,
  leftLabel,
  progress,
  passedPct,
  leftPct,
  index = 0,
  scrollY,
  reduceMotion = false,
  onPress,
}: BlockProps) {
  const progressColor = getProgressColor(progress);
  const leftColor = getProgressColor(progress);
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const enterY = useRef(new Animated.Value(reduceMotion ? 0 : 14)).current;
  const reveal = reduceMotion ? undefined : scrollRevealStyle(scrollY, index);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      enterY.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay: 50 + index * 55,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(enterY, {
        toValue: 0,
        duration: 460,
        delay: 50 + index * 55,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, enterY, index, reduceMotion]);

  const content = (
    <GlassCard style={styles.block}>
      <View style={styles.blockHeader}>
        <PeriodGlyph
          kind={glyph}
          size={36}
          accent={progressColor}
          progress={progress}
          pressed={pressed}
          animated={!reduceMotion}
        />
        <View style={styles.headerText}>
          <Text
            variant="sectionTitle"
            color="secondary"
            style={styles.blockTitle}
          >
            {title}
          </Text>
          <Text variant="caption" color="secondary">
            {leftPct}% left · {passedLabel} passed
          </Text>
        </View>
      </View>

      <Text
        variant="title"
        style={[styles.heroLeft, { color: leftColor }]}
        accessibilityRole="text"
      >
        {leftLabel}
      </Text>
      <Text variant="caption" color="secondary" style={styles.heroCaption}>
        left
      </Text>
      <Text variant="caption" color="secondary" style={styles.feelLine}>
        {feelForPeriod(glyph, progress)}
      </Text>

      <ProgressLine
        progress={progress}
        fillColor={progressColor}
        style={styles.progress}
      />
    </GlassCard>
  );

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: enterY }] }}>
      <Animated.View style={reveal}>
        {onPress ? (
          <Pressable
            onPress={onPress}
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            accessibilityRole="button"
            accessibilityLabel={`${title}: ${leftLabel} left, ${passedPct}% passed. Tap for details.`}
          >
            {content}
          </Pressable>
        ) : (
          content
        )}
      </Animated.View>
    </Animated.View>
  );
});

/**
 * TodayTimeBlock isolates the 1-second timer to prevent the entire HomeScreen
 * from re-rendering every second.
 */
function TodayTimeBlock({
  index,
  scrollY,
  reduceMotion,
  onPress,
}: {
  index: number;
  scrollY: Animated.Value;
  reduceMotion: boolean;
  onPress: () => void;
}) {
  const [liveNow, setLiveNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setLiveNow(new Date());
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const day = formatDayPassedLeftWithSeconds(liveNow);

  return (
    <TimeBlock
      index={index}
      scrollY={scrollY}
      reduceMotion={reduceMotion}
      glyph="day"
      title="Today"
      passedLabel={day.passedStr}
      leftLabel={day.leftStr}
      progress={day.progress}
      passedPct={day.passedPct}
      leftPct={day.leftPct}
      onPress={onPress}
    />
  );
}

export function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { userProfile, timeState } = useObserveTimeState();
  const goalsFeatureEnabled = useGoalsFeatureEnabled();
  const { canAccessLife } = useAccessControl();
  const reduceMotion = useReduceMotion();
  const { streak } = usePresenceStreak();
  const {
    reflection,
    visible: reflectionVisible,
    tone: reflectionTone,
    canUsePremiumReflections,
    dismiss: dismissReflection,
    setTone: setReflectionTone,
  } = useDailyReflection();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { width: pageWidth } = useWindowDimensions();
  const [pageIndex, setPageIndex] = useState(0);
  const loggedReportSwipe = useRef(false);

  useEffect(() => {
    navigation.setOptions({
      title: pageIndex === 0 ? 'Until: Days left' : 'Task report',
    });
  }, [navigation, pageIndex]);

  useFocusEffect(
    React.useCallback(() => {
      setEmberRouteOverride(pageIndex === 1 ? 'TaskReport' : null);
      return () => setEmberRouteOverride(null);
    }, [pageIndex]),
  );

  const onPagerScrollEnd = React.useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
      setPageIndex(next);
      if (next === 1 && !loggedReportSwipe.current) {
        loggedReportSwipe.current = true;
        void logAnalyticsEvent('home_swipe_to_task_report');
      }
    },
    [pageWidth],
  );

  const handleDayPress = React.useCallback(
    () => navigation.navigate('DayDetail'),
    [navigation],
  );
  const handleMonthPress = React.useCallback(
    () => navigation.navigate('MonthDetail'),
    [navigation],
  );
  const handleYearPress = React.useCallback(
    () => navigation.navigate('YearDetail'),
    [navigation],
  );
  const handleLifePress = React.useCallback(
    () => navigation.navigate('Life'),
    [navigation],
  );
  const handlePremiumPress = React.useCallback(() => {
    void logAnalyticsEvent('home_life_locked_tapped');
    navigation.navigate('Premium');
  }, [navigation]);
  const handleSettingsPress = React.useCallback(
    () => navigation.navigate('Settings'),
    [navigation],
  );
  const handleFabPress = React.useCallback(
    () =>
      navigation.navigate(
        goalsFeatureEnabled ? 'DailyTasks' : 'TasksComingSoon',
      ),
    [navigation, goalsFeatureEnabled],
  );

  const remainingDaysMonth = timeState.remainingDaysMonth ?? 0;
  const remainingDaysYear = timeState.remainingDaysYear ?? 0;

  const month = formatMonthPassedLeft(remainingDaysMonth);
  const year = formatYearPassedLeft(remainingDaysYear);
  const life = formatLifePassedLeft(
    timeState.life,
    timeState.remainingDaysLife,
    userProfile.deathAge ?? 80,
  );
  const hasBirthDate = !!userProfile.birthDate;

  const headerMotion = reduceMotion
    ? { opacity: 1 }
    : {
        opacity: scrollY.interpolate({
          inputRange: [0, 48, 110],
          outputRange: [1, 0.75, 0.35],
          extrapolate: 'clamp' as const,
        }),
        transform: [
          {
            translateY: scrollY.interpolate({
              inputRange: [0, 120],
              outputRange: [0, -28],
              extrapolate: 'clamp' as const,
            }),
          },
          {
            scale: scrollY.interpolate({
              inputRange: [0, 120],
              outputRange: [1, 0.94],
              extrapolate: 'clamp' as const,
            }),
          },
        ],
      };

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <ScrollView
          horizontal
          pagingEnabled
          nestedScrollEnabled
          directionalLockEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onPagerScrollEnd}
          style={styles.pager}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.page, { width: pageWidth }]}>
            <Animated.ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              directionalLockEnabled
              scrollEventThrottle={16}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true },
              )}
            >
              <Animated.View style={[styles.hero, headerMotion]}>
                <View style={styles.heroTop}>
                    <Ember progress={timeState.day ?? 0} size={48} />
                  <View style={styles.heroCopy}>
                    <Text
                      variant="caption"
                      color="secondary"
                      style={styles.greeting}
                    >
                      {timeOfDayLabel()}
                    </Text>
                    <Text variant="large" color="primary" style={styles.headline}>
                      Time reality
                    </Text>
                  </View>
                  {streak.count > 0 ? (
                    <View
                      style={[
                        styles.streakChip,
                        {
                          backgroundColor: theme.glassBg,
                          borderColor: theme.glassBorder,
                        },
                      ]}
                      accessibilityLabel={`${streak.count} day presence streak`}
                    >
                      <Text
                        variant="caption"
                        color="primary"
                        style={styles.streakNum}
                      >
                        {streak.count}
                      </Text>
                      <Text variant="micro" color="secondary">
                        {streak.count === 1 ? 'day' : 'days'}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text variant="body" color="secondary" style={styles.subhead}>
                  {homeHeroSupport()}
                </Text>
                <Text variant="micro" color="secondary" style={styles.swipeHint}>
                  Swipe left for task report →
                </Text>
              </Animated.View>

              <InterventionHomeCard />

              {reflectionVisible ? (
                <TimeCoachCard
                  reflection={reflection}
                  tone={reflectionTone}
                  canUsePremiumReflections={canUsePremiumReflections}
                  onDismiss={dismissReflection}
                  onToneChange={setReflectionTone}
                  onBirthDatePress={() => navigation.navigate('Settings')}
                />
              ) : null}

              <TodayTimeBlock
                index={0}
                scrollY={scrollY}
                reduceMotion={reduceMotion}
                onPress={handleDayPress}
              />

              <TimeBlock
                index={1}
                scrollY={scrollY}
                reduceMotion={reduceMotion}
                glyph="month"
                title="This month"
                passedLabel={`${month.passedDays} days`}
                leftLabel={`${month.leftDays} days`}
                progress={timeState.month}
                passedPct={month.passedPct}
                leftPct={month.leftPct}
                onPress={handleMonthPress}
              />

              <TimeBlock
                index={2}
                scrollY={scrollY}
                reduceMotion={reduceMotion}
                glyph="year"
                title="This year"
                passedLabel={`${year.passedDays} days`}
                leftLabel={`${year.leftDays} days`}
                progress={timeState.year}
                passedPct={year.passedPct}
                leftPct={year.leftPct}
                onPress={handleYearPress}
              />

              {hasBirthDate ? (
                canAccessLife ? (
                  <TimeBlock
                    index={3}
                    scrollY={scrollY}
                    reduceMotion={reduceMotion}
                    glyph="life"
                    title="Your life"
                    passedLabel={`${life.passedDays.toLocaleString()} days`}
                    leftLabel={`${life.leftDays.toLocaleString()} days`}
                    progress={timeState.life}
                    passedPct={life.passedPct}
                    leftPct={life.leftPct}
                    onPress={handleLifePress}
                  />
                ) : (
                  <GlassCard style={styles.block}>
                    <View style={styles.blockHeader}>
                      <PeriodGlyph
                        kind="life"
                        size={36}
                        animated={!reduceMotion}
                      />
                      <Text
                        variant="sectionTitle"
                        color="secondary"
                        style={styles.blockTitle}
                      >
                        Your life
                      </Text>
                    </View>
                    <Text
                      variant="body"
                      color="secondary"
                      style={styles.lifePrompt}
                    >
                      Premium, free preview, or a short unlock is required for Life
                      details. Open Premium to subscribe or restore.
                    </Text>
                    <Text
                      variant="caption"
                      color="primary"
                      style={styles.settingsLink}
                      onPress={handlePremiumPress}
                    >
                      Unlock Premium
                    </Text>
                  </GlassCard>
                )
              ) : (
                <GlassCard style={styles.block}>
                  <View style={styles.blockHeader}>
                    <PeriodGlyph kind="life" size={36} animated={!reduceMotion} />
                    <Text
                      variant="sectionTitle"
                      color="secondary"
                      style={styles.blockTitle}
                    >
                      Your life
                    </Text>
                  </View>
                  <Text variant="body" color="secondary" style={styles.lifePrompt}>
                    Set birth date in Settings to see how much life has passed and
                    how much is left.
                  </Text>
                  <Text
                    variant="caption"
                    color="primary"
                    style={styles.settingsLink}
                    onPress={handleSettingsPress}
                  >
                    Open Settings
                  </Text>
                </GlassCard>
              )}

              {!goalsFeatureEnabled ? (
                <GlassCard style={styles.comingSoonBlock}>
                  <Text
                    variant="sectionTitle"
                    color="secondary"
                    style={styles.blockTitleAlone}
                  >
                    Coming soon
                  </Text>
                  <Text variant="body" color="secondary">
                    Monthly goals and today&apos;s tasks will appear here in a
                    future update.
                  </Text>
                </GlassCard>
              ) : null}
            </Animated.ScrollView>
          </View>

          <View style={[styles.page, { width: pageWidth }]}>
            <TaskReportContent embedded />
          </View>
        </ScrollView>

        <View
          style={[
            styles.pageDots,
            { bottom: Math.max(insets.bottom, Spacing[2]) },
          ]}
          pointerEvents="none"
        >
          <View
            style={[
              styles.dot,
              {
                backgroundColor:
                  pageIndex === 0 ? theme.percent : theme.textMuted,
              },
            ]}
          />
          <View
            style={[
              styles.dot,
              {
                backgroundColor:
                  pageIndex === 1 ? theme.percent : theme.textMuted,
              },
            ]}
          />
        </View>

        {pageIndex === 0 ? (
          <TouchableOpacity
            style={[
              styles.fab,
              {
                backgroundColor: theme.percent,
                right: Spacing[4],
                bottom: Math.max(insets.bottom, Spacing[3]) + Spacing[2],
              },
            ]}
            onPress={handleFabPress}
            activeOpacity={0.85}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Rect
                x={5}
                y={3}
                width={14}
                height={18}
                rx={2}
                stroke="#FFFFFF"
                strokeWidth={2}
                fill="none"
              />
              <Line
                x1={8}
                y1={8}
                x2={16}
                y2={8}
                stroke="#FFFFFF"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              <Line
                x1={8}
                y1={12}
                x2={16}
                y2={12}
                stroke="#FFFFFF"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              <Line
                x1={8}
                y1={16}
                x2={14}
                y2={16}
                stroke="#FFFFFF"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            </Svg>
          </TouchableOpacity>
        ) : null}
      </ScreenGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pager: { flex: 1 },
  page: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingTop: Spacing[4],
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[7],
  },
  hero: {
    marginBottom: Spacing[1],
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[2],
  },
  heroCopy: {
    flex: 1,
  },
  streakChip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 44,
  },
  streakNum: {
    fontFamily: FontFamily.medium,
    letterSpacing: 0.4,
  },
  greeting: {
    letterSpacing: 0.8,
    marginBottom: Spacing[1],
    textTransform: 'uppercase',
  },
  headline: {
    marginBottom: 0,
    fontFamily: FontFamily.medium,
  },
  subhead: {
    marginBottom: Spacing[2],
    lineHeight: 22,
  },
  swipeHint: {
    marginBottom: Spacing[5],
    letterSpacing: 0.3,
    opacity: 0.75,
  },
  pageDots: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  block: {
    marginBottom: Spacing[4],
  },
  comingSoonBlock: {
    marginBottom: Spacing[4],
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  blockTitle: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    flexShrink: 1,
  },
  blockTitleAlone: {
    marginBottom: Spacing[3],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroLeft: {
    fontFamily: FontFamily.medium,
    fontSize: 28,
    marginBottom: 2,
  },
  heroCaption: {
    marginBottom: Spacing[2],
  },
  feelLine: {
    marginBottom: Spacing[3],
    fontStyle: 'italic',
    opacity: 0.9,
    lineHeight: 18,
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
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.fab,
  },
});
