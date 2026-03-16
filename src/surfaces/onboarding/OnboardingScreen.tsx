/**
 * Onboarding flow — 3 steps with swipe, shown in Auth stack after splash.
 * Uses theme only; no core/persistence/infrastructure.
 */

import React, {
  useState,
  useCallback,
  createContext,
  useContext,
  useRef,
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
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from '../../ui';
import {
  useTheme,
  Spacing,
  Typography,
  Radius,
  Weight,
  getFontFamilyForWeight,
  FontFamily,
  Shadows,
} from '../../theme';
import {
  OnboardingIcon1,
  OnboardingIcon2,
  OnboardingIcon3,
} from '../../assets/icons';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

const STEPS = [
  {
    stepTitle: 'Day Progress',
    title: 'Today is limited.',
    subtitle: 'See how much of it is already gone.',
    cta: 'Begin Journey',
    ctaGoesToNext: true,
  },
  {
    stepTitle: 'Time Tracking',
    title: 'Time leaves traces.',
    subtitle: 'Understand where your days are going.',
    cta: 'Next',
    ctaGoesToNext: true,
  },
  {
    stepTitle: 'Your life has a horizon.',
    title: 'Discover the weeks you’ve lived — and the ones still ahead.',
    titleBoldSuffix: 'cadence.',
    subtitle: 'Synchronize your life with the present.',
    cta: 'Begin Your Journey',
    ctaGoesToNext: false,
  },
] as const;

const OnboardingCompleteContext = createContext<(() => void) | null>(null);

export function useOnboardingComplete() {
  const cb = useContext(OnboardingCompleteContext);
  if (!cb) throw new Error('Must be used inside AuthNavigator');
  return cb;
}

/** CTA button — orange accent, white text. */
function CTAButton({
  label,
  onPress,
  showArrow,
}: {
  label: string;
  onPress: () => void;
  showArrow?: boolean;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      style={[styles.ctaButton, { backgroundColor: theme.percent }]}
      onPress={() => {
        Vibration.vibrate(10);
        onPress();
      }}
      activeOpacity={0.85}
    >
      <Text variant="sectionTitle" style={styles.ctaLabel}>
        {label}
        {showArrow ? ' →' : ''}
      </Text>
    </TouchableOpacity>
  );
}

const STEP_ICONS = [OnboardingIcon1, OnboardingIcon2, OnboardingIcon3] as const;

function StepIllustration({
  stepIndex,
  containerHeight,
  containerWidth,
}: {
  stepIndex: number;
  containerHeight: number;
  containerWidth: number;
}) {
  const theme = useTheme();
  const Icon = STEP_ICONS[stepIndex] ?? STEP_ICONS[0];
  return (
    <View
      style={[
        styles.illustrationSvgWrap,
        { height: containerHeight, width: containerWidth },
      ]}
    >
      {/* Full-bleed hero — slightly over-zoomed so edges are offscreen */}
      <Icon width={containerWidth * 1.3} height={containerHeight * 1.3} />

      {/* Top & bottom fade so image blends into background like reference */}
      <Svg
        pointerEvents="none"
        height={containerHeight}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <LinearGradient
            id={`onboardingFade-${stepIndex}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            {/* Top fade — thin band */}
            <Stop offset="0" stopColor={theme.background} stopOpacity="1" />
            <Stop offset="0.06" stopColor={theme.background} stopOpacity="0" />
            {/* Middle fully visible */}
            <Stop offset="0.94" stopColor={theme.background} stopOpacity="0" />
            {/* Bottom fade — mirror of top */}
            <Stop offset="1" stopColor={theme.background} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect
          x={0}
          y={0}
          width={containerWidth}
          height={containerHeight}
          fill={`url(#onboardingFade-${stepIndex})`}
        />
      </Svg>
    </View>
  );
}

function OnboardingScreenInner({ onGoToLogin }: { onGoToLogin: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const percent = theme.percent;
  const flatListRef = useRef<FlatList>(null);
  const [step, setStep] = useState(0);
  const safeStep = Math.min(Math.max(0, step), STEPS.length - 1);
  const config = STEPS[safeStep];
  const isFirst = safeStep === 0;
  const isLast = safeStep === STEPS.length - 1;
  const currentStepTitle = config.stepTitle;
  /** Content height for slide. Image area ~58% so hero feels zoomed and fades into content. */
  const contentHeight = Math.max(
    200,
    height - 44 - 140 - Math.max(insets.bottom, Spacing.lg),
  );
  const illustrationHeight = contentHeight * 0.58;

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const index = Math.round(x / width);
      setStep(Math.min(Math.max(0, index), STEPS.length - 1));
    },
    [width],
  );

  const handleSkip = useCallback(() => {
    Vibration.vibrate(10);
    onGoToLogin();
  }, [onGoToLogin]);

  const handleCta = useCallback(() => {
    if (config.ctaGoesToNext && !isLast) {
      flatListRef.current?.scrollToIndex({
        index: safeStep + 1,
        animated: true,
      });
    } else {
      onGoToLogin();
    }
  }, [config.ctaGoesToNext, isLast, safeStep, onGoToLogin]);

  const handleBack = useCallback(() => {
    if (safeStep > 0) {
      Vibration.vibrate(10);
      flatListRef.current?.scrollToIndex({
        index: safeStep - 1,
        animated: true,
      });
    }
  }, [safeStep]);

  const renderSlide = useCallback(
    ({ item, index }: { item: (typeof STEPS)[number]; index: number }) => (
      <View style={[styles.slide, { width }]}>
        {/* Image area — zoomed hero with bottom fade into background */}
        <View
          style={[
            styles.illustrationWrap,
            { minHeight: illustrationHeight, height: illustrationHeight },
          ]}
        >
          <StepIllustration
            stepIndex={index}
            containerHeight={illustrationHeight}
            containerWidth={width}
          />
        </View>
        {/* Title and subtitle below image */}
        <View style={styles.textBlock}>
          {'titleBoldSuffix' in item ? (
            <Text
              variant="display"
              style={[styles.title, { color: theme.textPrimary }]}
            >
              Find your{' '}
              <Text
                style={{
                  fontFamily: FontFamily.bold,
                  fontSize: Typography.display,
                }}
              >
                cadence.
              </Text>
            </Text>
          ) : (
            <Text
              variant="display"
              style={[styles.title, { color: theme.textPrimary }]}
            >
              {item.title}
            </Text>
          )}
          <Text
            variant="body"
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            {item.subtitle}
          </Text>
        </View>
      </View>
    ),
    [width, theme, illustrationHeight],
  );

  const keyExtractor = useCallback(
    (_: (typeof STEPS)[number], i: number) => String(i),
    [],
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Header — back (when not first), step title centered, Skip right */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {!isFirst ? (
            <TouchableOpacity onPress={handleBack} style={styles.backHit}>
              <Text variant="body" style={{ color: theme.textPrimary }}>
                ←
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.headerCenter}>
          <Text
            variant="sectionTitle"
            style={[styles.stepTitle, { color: theme.textPrimary }]}
          >
            {currentStepTitle}
          </Text>
        </View>
        <TouchableOpacity onPress={handleSkip} style={styles.skipHit}>
          <Text variant="body" style={{ color: theme.textSecondary }}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable slides */}
      <View style={styles.pagerWrap}>
        <FlatList
          ref={flatListRef}
          data={[...STEPS]}
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

      {/* Fixed footer — always visible, never cut off */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
        ]}
      >
        <View style={styles.pagination}>
          {STEPS.map((_, i) => {
            const isActive = i === safeStep;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  isActive
                    ? [styles.dotActive, { backgroundColor: percent }]
                    : [styles.dotInactiveBase, { backgroundColor: theme.progressTrack }],
                ]}
              />
            );
          })}
        </View>
        <CTAButton label={config.cta} onPress={handleCta} showArrow={isLast} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  headerLeft: {
    minWidth: 44,
    justifyContent: 'center',
  },
  stepTitle: {
    fontFamily: getFontFamilyForWeight(Weight.semibold),
  },
  skipHit: {
    padding: Spacing.sm,
    minWidth: 44,
  },
  backHit: {
    padding: Spacing.sm,
    minWidth: 44,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagerWrap: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'flex-start',
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  illustrationSvgWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  textBlock: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
    backgroundColor: 'transparent',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    height: 4,
  },
  dotActive: {
    width: 32,
    height: 4,
    borderRadius: 2,
  },
  dotInactiveBase: {
    width: 10,
    height: 4,
    borderRadius: 2,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.md,
    minHeight: 52,
    ...Shadows.card,
  },
  ctaLabel: {
    fontFamily: getFontFamilyForWeight(Weight.semibold),
    color: '#FFFFFF',
  },
});

export function OnboardingScreen() {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>
    >();
  const onGoToNext = useCallback(() => {
    navigation.navigate('IdentitySetup');
  }, [navigation]);
  return <OnboardingScreenInner onGoToLogin={onGoToNext} />;
}

export { OnboardingCompleteContext };
