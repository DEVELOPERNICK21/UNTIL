import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
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
  Ember,
  FAB,
} from '../../../shared/ui';
import { useObserveTimeState } from '../../time';
import {
  useGoalsFeatureEnabled,
} from '../../../shared/featureFlags/useGoalsFeatureEnabled';
import { useAccessControl } from '../../premium';
import { useReduceMotion } from '../../../shared/ui/useReduceMotion';
import {
  usePresenceStreak,
  useStreakCelebration,
  StreakChip,
} from '../../presence';
import { useDailyReflection, TimeCoachCard } from '../../reflections';
import {
  useBadges,
  useDailyQuests,
  BadgeShelf,
  DailyQuestsCard,
} from '../../badges';
import {
  Spacing,
  FontFamily,
  useTheme,
  homeHeroSupport,
  timeOfDayLabel,
} from '../../../shared/theme';
import type { RootStackParamList } from '../../../shared/navigation/types';
import { logAnalyticsEvent } from '../../../shared/analytics/analytics';
import { setEmberRouteOverride } from '../../../shared/ui/emberSurface';
import { TaskReportContent } from '../../tasks';
import { InterventionHomeCard } from '../../activity';
import { CountdownHomeCard, useNextCountdownDays } from '../../countdowns';
import { orderHomeCards, scrollDepthBucket } from '../domain/homeCardOrder';
import { useSwipeHint } from '../hooks/useSwipeHint';
import { HomeCardStack } from './HomeCardStack';
import { LockedLifeTile, TimeBlock, TodayTimeBlock } from './TimeBlock';
import {
  formatLifePassedLeft,
  formatMonthPassedLeft,
  formatYearPassedLeft,
} from '../../../shared/time/homeFormatters';

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
  const { celebrate: celebrateStreak, acknowledge: acknowledgeStreak } =
    useStreakCelebration();
  const quests = useDailyQuests();
  const badgeOverview = useBadges();
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
  const tileGap = Spacing[2];
  const contentWidth = pageWidth - Spacing[4] * 2;
  const compactTileWidth = (contentWidth - tileGap * 2) / 3;
  const [pageIndex, setPageIndex] = useState(0);
  const loggedReportSwipe = useRef(false);
  const swipeHint = useSwipeHint();
  const nextCountdownDays = useNextCountdownDays();
  const deepestScroll = useRef(0);

  // Which cards show under the tiles depends on the hour and on any countdown that is close.
  const cardOrder = useMemo(
    () =>
      orderHomeCards({
        hour: new Date().getHours(),
        nextCountdownDays,
        coachAvailable: reflectionVisible,
      }),
    [nextCountdownDays, reflectionVisible],
  );

  /** Counts how far down Home people get, so the card order can be judged on evidence. */
  const onHomeScrollEnd = React.useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
      const depth = scrollDepthBucket(
        contentOffset.y,
        layoutMeasurement.height,
        contentSize.height,
      );
      if (depth > deepestScroll.current) {
        deepestScroll.current = depth;
        void logAnalyticsEvent('home_scroll_depth', { depth });
      }
    },
    [],
  );

  useEffect(() => {
    navigation.setOptions({
      title: pageIndex === 0 ? 'UNTIL' : 'Task report',
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
        swipeHint.learned();
      }
    },
    [pageWidth, swipeHint],
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
  const handleBadgesPress = React.useCallback(
    () => navigation.navigate('Badges'),
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
              onScrollEndDrag={onHomeScrollEnd}
              onMomentumScrollEnd={onHomeScrollEnd}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true },
              )}
            >
              <Animated.View style={[styles.hero, headerMotion]}>
                <View style={styles.heroTop}>
                  <Ember progress={timeState.day ?? 0} size={44} />
                  <View style={styles.heroCopy}>
                    <Text
                      variant="caption"
                      color="secondary"
                      style={styles.greeting}
                    >
                      {timeOfDayLabel()}
                    </Text>
                    <Text variant="title" color="primary" style={styles.headline}>
                      Time reality
                    </Text>
                  </View>
                  {streak.count > 0 ? (
                    <StreakChip
                      count={streak.count}
                      lit={streak.noticedToday}
                      celebrate={celebrateStreak}
                      onCelebrated={acknowledgeStreak}
                      onPress={handleBadgesPress}
                    />
                  ) : null}
                </View>
                <Text
                  variant="body"
                  color="secondary"
                  numberOfLines={2}
                  style={styles.subhead}
                >
                  {homeHeroSupport()}
                </Text>
                {swipeHint.visible ? (
                  <Text variant="micro" color="secondary" style={styles.swipeHint}>
                    Swipe left for task report →
                  </Text>
                ) : null}
              </Animated.View>

              <View style={styles.tileWide}>
                <TodayTimeBlock
                  index={0}
                  scrollY={scrollY}
                  reduceMotion={reduceMotion}
                  size="wide"
                  onPress={handleDayPress}
                />
              </View>
              <View style={styles.tileRow}>
                <View style={[styles.tileCell, { width: compactTileWidth }]}>
                  <TimeBlock
                    index={1}
                    scrollY={scrollY}
                    reduceMotion={reduceMotion}
                    size="compact"
                    glyph="month"
                    title="Month"
                    passedLabel={`${month.passedDays} days`}
                    leftLabel={`${month.leftDays} days`}
                    progress={timeState.month}
                    passedPct={month.passedPct}
                    leftPct={month.leftPct}
                    onPress={handleMonthPress}
                  />
                </View>
                <View style={[styles.tileCell, { width: compactTileWidth }]}>
                  <TimeBlock
                    index={2}
                    scrollY={scrollY}
                    reduceMotion={reduceMotion}
                    size="compact"
                    glyph="year"
                    title="Year"
                    passedLabel={`${year.passedDays} days`}
                    leftLabel={`${year.leftDays} days`}
                    progress={timeState.year}
                    passedPct={year.passedPct}
                    leftPct={year.leftPct}
                    onPress={handleYearPress}
                  />
                </View>
                <View style={[styles.tileCell, { width: compactTileWidth }]}>
                  {hasBirthDate && canAccessLife ? (
                    <TimeBlock
                      index={3}
                      scrollY={scrollY}
                      reduceMotion={reduceMotion}
                      size="compact"
                      glyph="life"
                      title="Life"
                      passedLabel={`${life.passedDays.toLocaleString()} days`}
                      leftLabel={`${life.leftDays.toLocaleString()} days`}
                      progress={timeState.life}
                      passedPct={life.passedPct}
                      leftPct={life.leftPct}
                      onPress={handleLifePress}
                    />
                  ) : hasBirthDate ? (
                    <LockedLifeTile
                      size="compact"
                      reduceMotion={reduceMotion}
                      label="Unlock"
                      accessibilityLabel="Life is locked. Open Premium to unlock."
                      onPress={handlePremiumPress}
                    />
                  ) : (
                    <LockedLifeTile
                      size="compact"
                      reduceMotion={reduceMotion}
                      label="Set birth date"
                      accessibilityLabel="Set birth date in Settings to see life progress."
                      onPress={handleSettingsPress}
                    />
                  )}
                </View>
              </View>

              <HomeCardStack
                order={cardOrder}
                cards={{
                  quests: (
                    <DailyQuestsCard quests={quests} onQuestPress={handleFabPress} />
                  ),
                  countdown: <CountdownHomeCard />,
                  coach: reflectionVisible ? (
                    <TimeCoachCard
                      reflection={reflection}
                      tone={reflectionTone}
                      canUsePremiumReflections={canUsePremiumReflections}
                      onDismiss={dismissReflection}
                      onToneChange={setReflectionTone}
                      onBirthDatePress={() => navigation.navigate('Settings')}
                    />
                  ) : null,
                  lostTime: <InterventionHomeCard />,
                  badges: (
                    <BadgeShelf overview={badgeOverview} onOpen={handleBadgesPress} />
                  ),
                }}
              />

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
          <FAB
            onPress={handleFabPress}
            label="Tasks"
            accessibilityLabel="Today's tasks"
            style={{
              position: 'absolute',
              right: Spacing[4],
              bottom: Math.max(insets.bottom, Spacing[3]) + Spacing[2],
            }}
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
          </FAB>
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
  greeting: {
    letterSpacing: 0.3,
    marginBottom: Spacing[1],
  },
  headline: {
    marginBottom: 0,
    fontFamily: FontFamily.medium,
  },
  subhead: {
    marginBottom: Spacing[3],
    lineHeight: 22,
  },
  swipeHint: {
    marginBottom: Spacing[3],
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
  tileWide: {
    marginBottom: Spacing[2],
  },
  tileRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  tileCell: {},
  comingSoonBlock: {
    marginBottom: Spacing[3],
  },
  blockTitleAlone: {
    marginBottom: Spacing[2],
    letterSpacing: 0.3,
  },
});
