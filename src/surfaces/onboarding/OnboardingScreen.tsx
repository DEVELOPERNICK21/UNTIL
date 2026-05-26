/**
 * Onboarding flow — 3 carousel steps, then Home (birth date deferred to Settings).
 */

import React, {
  useState,
  useCallback,
  createContext,
  useContext,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Vibration,
  Image,
  ImageSourcePropType,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Text, Card, DotsGrid } from '../../ui';
import {
  useTheme,
  Spacing,
  Typography,
  Radius,
  Weight,
  getFontFamilyForWeight,
} from '../../theme';
import { onboardingImages } from '../../assets/images';
import { useAnalytics } from '../../hooks';

type StepConfig = {
  title: string;
  subtitle: string;
  cta: string;
  ctaGoesToNext: boolean;
  hero: (typeof onboardingImages)[number];
  showDayProgress?: boolean;
  showLifeGrid?: boolean;
};

const STEPS: StepConfig[] = [
  {
    title: 'Today is limited.',
    subtitle:
      "Live day, month, and year progress in real time. See what's passed and what's left at a glance.",
    cta: 'Continue',
    ctaGoesToNext: true,
    hero: onboardingImages[0],
    showDayProgress: true,
  },
  {
    title: 'Your life has a horizon.',
    subtitle:
      'Visualize your life in weeks. Understand your cadence and focus on what truly matters.',
    cta: 'Continue',
    ctaGoesToNext: true,
    hero: onboardingImages[1],
    showLifeGrid: true,
  },
  {
    title: 'Find your cadence.',
    subtitle:
      'Glanceable widgets for your home and lock screen. Time context without the clutter.',
    cta: 'Get Started',
    ctaGoesToNext: false,
    hero: onboardingImages[2],
  },
];

const OnboardingCompleteContext = createContext<(() => void) | null>(null);

export function useOnboardingComplete() {
  const cb = useContext(OnboardingCompleteContext);
  if (!cb) throw new Error('Must be used inside AuthNavigator');
  return cb;
}

function BrandHeader({ onSkip }: { onSkip: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.brandHeader}>
      <View style={styles.brandLeft}>
        <Text variant="body" style={{ color: theme.percent }}>
          ⏳
        </Text>
        <Text
          variant="sectionTitle"
          style={[styles.brandTitle, { color: theme.textPrimary }]}
        >
          UNTIL
        </Text>
      </View>
      <TouchableOpacity onPress={onSkip} hitSlop={12}>
        <Text variant="body" style={{ color: theme.textSecondary }}>
          Skip
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function HeroImage({
  source,
  height,
  width,
  stepIndex,
}: {
  source: ImageSourcePropType;
  height: number;
  width: number;
  stepIndex: number;
}) {
  const theme = useTheme();
  const fadeId = `onboardingHeroFade-${stepIndex}`;
  return (
    <View style={[styles.heroWrap, { height, width }]}>
      <Image
        source={source}
        style={[
          styles.heroImage,
          { width: width * 1.08, height: height * 1.12, marginLeft: -width * 0.04 },
        ]}
        resizeMode="cover"
      />
      <Svg pointerEvents="none" height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.background} stopOpacity="0.35" />
            <Stop offset="0.12" stopColor={theme.background} stopOpacity="0" />
            <Stop offset="0.72" stopColor={theme.background} stopOpacity="0" />
            <Stop offset="1" stopColor={theme.background} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill={`url(#${fadeId})`} />
      </Svg>
    </View>
  );
}

function DayProgressDemo() {
  const theme = useTheme();
  const demoProgress = 0.72;
  return (
    <View style={styles.dayProgressBlock}>
      <View style={styles.dayProgressRow}>
        <Text
          variant="micro"
          style={[styles.dayProgressLabel, { color: theme.textSecondary }]}
        >
          DAY PROGRESS
        </Text>
        <Text
          variant="title"
          style={[styles.dayProgressPct, { color: theme.percent }]}
        >
          72%
        </Text>
      </View>
      <View
        style={[styles.progressTrack, { backgroundColor: theme.progressTrack }]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${demoProgress * 100}%`,
              backgroundColor: theme.percent,
            },
          ]}
        />
      </View>
    </View>
  );
}

function LifeGridPreview() {
  const theme = useTheme();
  return (
    <Card style={styles.lifeGridCard} lighter>
      <View style={styles.lifeGridHeader}>
        <Text variant="micro" style={{ color: theme.textSecondary }}>
          LIFE PROGRESS
        </Text>
        <Text variant="micro" style={{ color: theme.percent }}>
          2,140 weeks lived
        </Text>
      </View>
      <DotsGrid
        rows={3}
        cols={12}
        fillCount={16}
        fillColor={theme.percent}
        emptyColor={theme.progressTrack}
        size={8}
        gap={6}
      />
    </Card>
  );
}

function OnboardingScreenInner() {
  const completeOnboarding = useOnboardingComplete();
  const { logEvent } = useAnalytics();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [step, setStep] = useState(0);
  const safeStep = Math.min(Math.max(0, step), STEPS.length - 1);
  const config = STEPS[safeStep];
  const isLast = safeStep === STEPS.length - 1;

  const heroHeight = Math.min(
    Math.max(220, (height - insets.top - 120) * 0.5),
    400,
  );

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const index = Math.round(x / width);
      setStep(Math.min(Math.max(0, index), STEPS.length - 1));
    },
    [width],
  );

  useEffect(() => {
    logEvent('onboarding_step', { step: safeStep + 1 });
  }, [logEvent, safeStep]);

  const finishOnboarding = useCallback(() => {
    Vibration.vibrate(10);
    completeOnboarding();
  }, [completeOnboarding]);

  const handleCta = useCallback(() => {
    Vibration.vibrate(10);
    if (config.ctaGoesToNext && !isLast) {
      flatListRef.current?.scrollToIndex({
        index: safeStep + 1,
        animated: true,
      });
    } else {
      finishOnboarding();
    }
  }, [config.ctaGoesToNext, isLast, safeStep, finishOnboarding]);

  const renderSlide = useCallback(
    ({ item, index }: { item: StepConfig; index: number }) => (
      <View style={[styles.slide, { width }]}>
        <View style={[styles.heroBleed, { width }]}>
          <HeroImage
            source={item.hero}
            height={heroHeight}
            width={width}
            stepIndex={index}
          />
        </View>
        <View style={styles.textBlock}>
          <Text
            variant="display"
            style={[styles.title, { color: theme.textPrimary }]}
          >
            {item.title}
          </Text>
          <Text
            variant="body"
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            {item.subtitle}
          </Text>
          {item.showDayProgress ? <DayProgressDemo /> : null}
          {item.showLifeGrid ? <LifeGridPreview /> : null}
        </View>
        <View style={styles.slideDots}>
          {STEPS.map((_, i) => {
            const active = i === index;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  active
                    ? [styles.dotActive, { backgroundColor: theme.percent }]
                    : [
                        styles.dotInactive,
                        { backgroundColor: theme.progressTrack },
                      ],
                ]}
              />
            );
          })}
        </View>
      </View>
    ),
    [width, theme, heroHeight],
  );

  const keyExtractor = useCallback((_: StepConfig, i: number) => String(i), []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <BrandHeader onSkip={finishOnboarding} />

      <View style={styles.pagerWrap}>
        <FlatList
          ref={flatListRef}
          data={STEPS}
          renderItem={renderSlide}
          keyExtractor={keyExtractor}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          onScrollToIndexFailed={info => {
            setTimeout(
              () =>
                flatListRef.current?.scrollToIndex({
                  index: info.index,
                  animated: false,
                }),
              100,
            );
          }}
          bounces={false}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />
      </View>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
        ]}
      >
        <TouchableOpacity onPress={finishOnboarding} style={styles.footerSkip}>
          <Text variant="body" style={{ color: theme.textSecondary }}>
            ✕ Skip
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.ctaPill, { backgroundColor: theme.percent }]}
          onPress={handleCta}
          activeOpacity={0.85}
        >
          <Text variant="sectionTitle" style={styles.ctaPillLabel}>
            {config.cta}
          </Text>
          <Text variant="sectionTitle" style={styles.ctaPillLabel}>
            {' '}
            →
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandTitle: {
    letterSpacing: 1,
    fontFamily: getFontFamilyForWeight(Weight.semibold),
  },
  pagerWrap: {
    flex: 1,
  },
  slide: {
    flex: 1,
  },
  heroBleed: {
    overflow: 'hidden',
  },
  heroWrap: {
    width: '100%',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    position: 'absolute',
    top: 0,
  },
  textBlock: {
    flex: 1,
    marginTop: -Spacing.lg,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  title: {
    textAlign: 'left',
  },
  subtitle: {
    textAlign: 'left',
    lineHeight: Typography.body * 1.5,
  },
  dayProgressBlock: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  dayProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  dayProgressLabel: {
    letterSpacing: 2,
  },
  dayProgressPct: {
    fontFamily: getFontFamilyForWeight(Weight.semibold),
  },
  progressTrack: {
    height: 14,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  lifeGridCard: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  lifeGridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slideDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 32,
  },
  dotInactive: {
    width: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  footerSkip: {
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.md,
  },
  ctaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    minHeight: 48,
  },
  ctaPillLabel: {
    fontFamily: getFontFamilyForWeight(Weight.semibold),
    color: '#FFFFFF',
  },
});

export function OnboardingScreen() {
  return <OnboardingScreenInner />;
}

export { OnboardingCompleteContext };
