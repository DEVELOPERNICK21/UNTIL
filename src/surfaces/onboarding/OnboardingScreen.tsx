/**
 * Psychology quiz funnel with interactive Ember / day / widget beats.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Vibration,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, ScreenGradient, Ember } from '../../ui';
import {
  useTheme,
  Spacing,
  Typography,
  Weight,
  getFontFamilyForWeight,
  Radius,
} from '../../theme';
import { useAnalytics, useOnboardingFunnel } from '../../hooks';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import type {
  OnboardingCadence,
  OnboardingDrain,
  OnboardingFunnelStep,
  OnboardingGoal,
  OnboardingReadiness,
  OnboardingValues,
} from '../../types';
import { FunnelProgressBar } from './FunnelProgressBar';
import { QuizOptionList } from './QuizOptionList';
import { InteractiveWelcome } from './InteractiveWelcome';
import { InteractiveDayDemo } from './InteractiveDayDemo';
import { InteractiveWidgets } from './InteractiveWidgets';
import { useCtaPressScale, useEnter } from './onboardingMotion';
import {
  CADENCE_OPTIONS,
  DRAIN_OPTIONS,
  GOAL_OPTIONS,
  QUIZ_PROMPTS,
  READINESS_OPTIONS,
  VALUES_OPTIONS,
} from './quizContent';

type AuthNav = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

const STACK_STEPS: OnboardingFunnelStep[] = [
  'identity',
  'life_weeks',
  'paywall',
];

const BACK_HIDDEN: OnboardingFunnelStep[] = [
  'brand',
  'loader',
  'results',
  'identity',
  'life_weeks',
  'paywall',
];

const DEMO_STEPS: OnboardingFunnelStep[] = [
  'brand',
  'day_demo',
  'widgets_demo',
];

export function OnboardingScreen() {
  const navigation = useNavigation<AuthNav>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { logEvent } = useAnalytics();
  const {
    step,
    answers,
    progress,
    encouragement,
    resultCards,
    setStep,
    advance,
    goBack,
    patchAnswers,
    sync,
  } = useOnboardingFunnel();

  const loaderStarted = useRef(false);
  const { scale: ctaScale, bounce: bounceCta } = useCtaPressScale();

  useFocusEffect(
    useCallback(() => {
      sync();
    }, [sync])
  );

  useEffect(() => {
    logEvent('onboarding_step_view', { step });
  }, [step, logEvent]);

  useEffect(() => {
    if (step === 'identity') {
      navigation.navigate('IdentitySetup');
      return;
    }
    if (step === 'life_weeks') {
      navigation.navigate('LifeWeeksPreview');
      return;
    }
    if (step === 'paywall') {
      navigation.navigate('OnboardingPaywall');
    }
  }, [step, navigation]);

  useEffect(() => {
    if (step !== 'loader') {
      loaderStarted.current = false;
      return;
    }
    if (loaderStarted.current) return;
    loaderStarted.current = true;
    const id = setTimeout(() => {
      setStep('results');
    }, 2600);
    return () => clearTimeout(id);
  }, [step, setStep]);

  const showProgress = !STACK_STEPS.includes(step) && step !== 'brand';
  const showBack = !BACK_HIDDEN.includes(step);
  const showContinue = DEMO_STEPS.includes(step) || step === 'interstitial';

  const handleBack = () => {
    if (step === 'q_values') {
      setStep('life_weeks');
      return;
    }
    goBack();
  };

  const handleContinue = () => {
    Vibration.vibrate(10);
    bounceCta();
    if (step === 'interstitial') {
      setStep('identity');
      return;
    }
    advance();
  };

  const selectAndAdvance = <T extends string>(
    field: keyof typeof answers,
    value: T,
    analyticsStep: string
  ) => {
    patchAnswers({ [field]: value } as Partial<typeof answers>);
    logEvent('onboarding_answer', { step: analyticsStep, value });
    setTimeout(() => advance(), 160);
  };

  const renderBody = () => {
    switch (step) {
      case 'brand':
        return (
          <InteractiveWelcome
            active
            title={QUIZ_PROMPTS.brandTitle}
            subtitle={QUIZ_PROMPTS.brandSub}
          />
        );

      case 'day_demo':
        return <InteractiveDayDemo active />;

      case 'widgets_demo':
        return <InteractiveWidgets active />;

      case 'q_goal':
        return (
          <QuestionLayout title={QUIZ_PROMPTS.q_goal} emberProgress={0.28}>
            <QuizOptionList
              options={GOAL_OPTIONS}
              selected={answers.goal}
              onSelect={(value: OnboardingGoal) =>
                selectAndAdvance('goal', value, 'q_goal')
              }
            />
          </QuestionLayout>
        );

      case 'q_drain':
        return (
          <QuestionLayout title={QUIZ_PROMPTS.q_drain} emberProgress={0.42}>
            <QuizOptionList
              options={DRAIN_OPTIONS}
              selected={answers.timeDrain}
              onSelect={(value: OnboardingDrain) =>
                selectAndAdvance('timeDrain', value, 'q_drain')
              }
            />
          </QuestionLayout>
        );

      case 'interstitial':
        return <InterstitialBeat />;

      case 'q_values':
        return (
          <QuestionLayout title={QUIZ_PROMPTS.q_values} emberProgress={0.55}>
            <QuizOptionList
              options={VALUES_OPTIONS}
              selected={answers.valuesPriority}
              onSelect={(value: OnboardingValues) =>
                selectAndAdvance('valuesPriority', value, 'q_values')
              }
            />
          </QuestionLayout>
        );

      case 'q_cadence':
        return (
          <QuestionLayout title={QUIZ_PROMPTS.q_cadence} emberProgress={0.68}>
            <QuizOptionList
              options={CADENCE_OPTIONS}
              selected={answers.cadence}
              onSelect={(value: OnboardingCadence) =>
                selectAndAdvance('cadence', value, 'q_cadence')
              }
            />
          </QuestionLayout>
        );

      case 'q_readiness':
        return (
          <QuestionLayout title={QUIZ_PROMPTS.q_readiness} emberProgress={0.8}>
            <QuizOptionList
              options={READINESS_OPTIONS}
              selected={answers.readiness}
              onSelect={(value: OnboardingReadiness) =>
                selectAndAdvance('readiness', value, 'q_readiness')
              }
            />
          </QuestionLayout>
        );

      case 'loader':
        return <LoaderBeat />;

      case 'results':
        return (
          <ResultsBeat
            cards={resultCards}
            onBack={() => setStep('q_readiness')}
            onContinue={() => {
              logEvent('onboarding_results_view', {
                goal: answers.goal,
                drain: answers.timeDrain,
                cadence: answers.cadence,
              });
              Vibration.vibrate(10);
              setStep('paywall');
            }}
          />
        );

      default:
        return (
          <View style={styles.centerBlock}>
            <Ember progress={0.5} size={56} />
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View
            style={[
              styles.header,
              { paddingTop: Spacing[2], paddingHorizontal: Spacing[4] },
            ]}
          >
            {showBack ? (
              <TouchableOpacity
                onPress={handleBack}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.backHit}
              >
                <Text variant="body" style={{ color: theme.textPrimary }}>
                  ‹
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.backHit} />
            )}
            <View style={styles.headerCenter}>
              <FunnelProgressBar
                progress={progress}
                visible={showProgress}
                encouragement={encouragement}
              />
            </View>
            <View style={styles.backHit} />
          </View>
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              {
                paddingBottom:
                  Math.max(insets.bottom, Spacing[4]) +
                  (showContinue ? 88 : Spacing[4]),
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderBody()}
          </ScrollView>

          {showContinue ? (
            <View
              style={[
                styles.footer,
                { paddingBottom: Math.max(insets.bottom, Spacing[3]) },
              ]}
            >
              <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
                <TouchableOpacity
                  style={[styles.ctaFull, { backgroundColor: theme.percent }]}
                  onPress={handleContinue}
                  activeOpacity={0.9}
                >
                  <Text variant="sectionTitle" style={styles.ctaFullLabel}>
                    {step === 'brand'
                      ? 'Show me how it works'
                      : step === 'day_demo'
                        ? 'Next'
                        : step === 'widgets_demo'
                          ? 'Build my time map'
                          : 'Continue'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          ) : null}
        </SafeAreaView>
      </ScreenGradient>
    </View>
  );
}

function QuestionLayout({
  title,
  emberProgress,
  children,
}: {
  title: string;
  emberProgress: number;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const titleEnter = useEnter(true, 40);
  const emberEnter = useEnter(true, 0);
  const bodyEnter = useEnter(true, 120);

  return (
    <View style={styles.questionBlock}>
      <Animated.View style={[styles.emberCenter, emberEnter]}>
        <Ember progress={emberProgress} size={48} />
      </Animated.View>
      <Animated.View style={titleEnter}>
        <Text
          variant="sectionTitle"
          style={[
            styles.questionTitle,
            {
              color: theme.textPrimary,
              fontFamily: getFontFamilyForWeight(Weight.semibold),
            },
          ]}
        >
          {title}
        </Text>
      </Animated.View>
      <Animated.View style={bodyEnter}>{children}</Animated.View>
    </View>
  );
}

function InterstitialBeat() {
  const theme = useTheme();
  const title = useEnter(true, 60);
  const ember = useEnter(true, 0);

  return (
    <View style={styles.centerBlock}>
      <Animated.View style={ember}>
        <Ember progress={0.48} size={72} />
      </Animated.View>
      <Animated.View style={title}>
        <Text
          variant="sectionTitle"
          style={[
            styles.title,
            {
              color: theme.textPrimary,
              fontFamily: getFontFamilyForWeight(Weight.semibold),
              fontSize: Typography.sectionTitle,
            },
          ]}
        >
          {QUIZ_PROMPTS.interstitial}
        </Text>
      </Animated.View>
    </View>
  );
}

function LoaderBeat() {
  const theme = useTheme();
  const title = useEnter(true, 80);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.centerBlock}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Ember progress={0.62} size={80} />
      </Animated.View>
      <Animated.View style={title}>
        <Text
          variant="sectionTitle"
          style={[
            styles.title,
            {
              color: theme.textPrimary,
              marginTop: Spacing[4],
              fontFamily: getFontFamilyForWeight(Weight.semibold),
            },
          ]}
        >
          {QUIZ_PROMPTS.loaderTitle}
        </Text>
        <Text
          variant="caption"
          style={{
            color: theme.textSecondary,
            textAlign: 'center',
            marginTop: Spacing[2],
          }}
        >
          Matching your answers to a weekly plan…
        </Text>
      </Animated.View>
    </View>
  );
}

function ResultsBeat({
  cards,
  onBack,
  onContinue,
}: {
  cards: { id: string; text: string }[];
  onBack: () => void;
  onContinue: () => void;
}) {
  const theme = useTheme();
  const header = useEnter(true, 40);
  const { scale, bounce } = useCtaPressScale();

  return (
    <View style={styles.resultsBlock}>
      <Animated.View style={header}>
        <Ember progress={0.88} size={64} />
        <Text
          variant="display"
          style={[
            styles.title,
            {
              color: theme.textPrimary,
              marginTop: Spacing[3],
              fontFamily: getFontFamilyForWeight(Weight.bold),
            },
          ]}
        >
          {QUIZ_PROMPTS.resultsTitle}
        </Text>
        <Text
          variant="body"
          style={[styles.subtitle, { color: theme.textSecondary }]}
        >
          {QUIZ_PROMPTS.resultsSub}
        </Text>
      </Animated.View>

      <View style={styles.cards}>
        {cards.map((card, index) => (
          <ResultCard key={card.id} text={card.text} index={index} />
        ))}
      </View>

      <View style={styles.resultsFooter}>
        <TouchableOpacity
          style={[styles.halfBtn, { borderColor: theme.divider }]}
          onPress={onBack}
          activeOpacity={0.75}
        >
          <Text style={{ color: theme.textPrimary }}>Back</Text>
        </TouchableOpacity>
        <Animated.View style={[{ flex: 1 }, { transform: [{ scale }] }]}>
          <TouchableOpacity
            style={[
              styles.halfBtnFill,
              {
                backgroundColor: theme.percent,
                borderColor: theme.percent,
              },
            ]}
            onPress={() => {
              bounce();
              onContinue();
            }}
            activeOpacity={0.9}
          >
            <Text
              style={{
                color: '#0E0E10',
                fontFamily: getFontFamilyForWeight(Weight.semibold),
              }}
            >
              Continue
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

function ResultCard({ text, index }: { text: string; index: number }) {
  const theme = useTheme();
  const enter = useEnter(true, 120 + index * 90);

  return (
    <Animated.View
      style={[
        styles.resultCard,
        enter,
        {
          backgroundColor: theme.cardBase,
          borderColor: theme.divider,
        },
      ]}
    >
      <Text style={{ color: theme.percent, marginRight: Spacing[2] }}>✓</Text>
      <Text
        variant="body"
        style={{
          color: theme.textPrimary,
          flex: 1,
          fontFamily: getFontFamilyForWeight(Weight.medium),
        }}
      >
        {text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backHit: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: Spacing[2],
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing[4],
  },
  centerBlock: {
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[6],
  },
  questionBlock: {
    gap: Spacing[3],
    paddingVertical: Spacing[4],
  },
  emberCenter: {
    alignItems: 'center',
    marginBottom: Spacing[1],
  },
  questionTitle: {
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  footer: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[2],
  },
  ctaFull: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  ctaFullLabel: {
    color: '#0E0E10',
    fontFamily: getFontFamilyForWeight(Weight.semibold),
  },
  resultsBlock: {
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[4],
  },
  cards: {
    width: '100%',
    gap: Spacing[2],
    marginTop: Spacing[2],
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
  },
  resultsFooter: {
    flexDirection: 'row',
    gap: Spacing[2],
    width: '100%',
    marginTop: Spacing[4],
    alignItems: 'center',
  },
  halfBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  halfBtnFill: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
});

export {
  OnboardingCompleteContext,
  useOnboardingComplete,
} from './OnboardingCompleteContext';
