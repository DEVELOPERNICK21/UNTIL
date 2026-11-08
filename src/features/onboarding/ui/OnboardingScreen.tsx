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
import { Text, ScreenGradient, Ember } from '../../../shared/ui';
import {
  useTheme,
  Spacing,
  Weight,
  getFontFamilyForWeight,
  Radius,
} from '../../../shared/theme';
import { useAnalytics } from '../../../shared/analytics/useAnalytics';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useOnboardingFunnel } from '../hooks/useOnboardingFunnel';
import type { AuthStackParamList } from '../../../shared/navigation/types';
import type {
  OnboardingCadence,
  OnboardingDrain,
  OnboardingFunnelStep,
  OnboardingGoal,
  OnboardingReadiness,
  OnboardingValues,
} from '../../../shared/types';
import { FunnelProgressBar } from './FunnelProgressBar';
import { OnboardingPinWidget } from './OnboardingPinWidget';
import { QuizOptionList } from './QuizOptionList';
import { InteractiveWelcome } from './InteractiveWelcome';
import { InteractiveDayDemo } from './InteractiveDayDemo';
import { InteractiveWidgets } from './InteractiveWidgets';
import { useCtaPressScale } from './onboardingMotion';
import {
  InterstitialBeat,
  LoaderBeat,
  QuestionLayout,
} from './OnboardingBeats';
import { ResultsBeat } from './OnboardingResults';
import {
  getCadenceOptions,
  getDrainOptions,
  getGoalOptions,
  getQuizPrompts,
  getReadinessOptions,
  getValuesOptions,
} from './quizContent';
import { onboardingStepViewProps } from '../domain/analyticsFunnels';

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

const LOADER_BEAT_MS = 700; // computes nothing: a short beat before the results
export function OnboardingScreen() {
  const { t } = useTranslation();
  const prompts = getQuizPrompts();
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
    logEvent('onboarding_step_view', onboardingStepViewProps(step));
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
    }, LOADER_BEAT_MS);
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

    logEvent('onboarding_answer', {
      ...onboardingStepViewProps(analyticsStep as typeof step),
      value,
    });
    setTimeout(() => advance(), 160);
  };

  const renderBody = () => {
    switch (step) {
      case 'brand':
        return (
          <InteractiveWelcome
            active
            title={prompts.brandTitle}
            subtitle={prompts.brandSub}
          />
        );

      case 'day_demo':
        return <InteractiveDayDemo active />;

      case 'widgets_demo':
        return <InteractiveWidgets active />;

      case 'q_goal':
        return (
          <QuestionLayout title={prompts.q_goal} emberProgress={0.28}>
            <QuizOptionList
              options={getGoalOptions()}
              selected={answers.goal}
              onSelect={(value: OnboardingGoal) =>
                selectAndAdvance('goal', value, 'q_goal')
              }
            />
          </QuestionLayout>
        );

      case 'q_drain':
        return (
          <QuestionLayout title={prompts.q_drain} emberProgress={0.42}>
            <QuizOptionList
              options={getDrainOptions()}
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
          <QuestionLayout title={prompts.q_values} emberProgress={0.55}>
            <QuizOptionList
              options={getValuesOptions()}
              selected={answers.valuesPriority}
              onSelect={(value: OnboardingValues) =>
                selectAndAdvance('valuesPriority', value, 'q_values')
              }
            />
          </QuestionLayout>
        );

      case 'q_cadence':
        return (
          <QuestionLayout title={prompts.q_cadence} emberProgress={0.68}>
            <QuizOptionList
              options={getCadenceOptions()}
              selected={answers.cadence}
              onSelect={(value: OnboardingCadence) =>
                selectAndAdvance('cadence', value, 'q_cadence')
              }
            />
          </QuestionLayout>
        );

      case 'q_readiness':
        return (
          <QuestionLayout title={prompts.q_readiness} emberProgress={0.8}>
            <QuizOptionList
              options={getReadinessOptions()}
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
                  (showContinue ? (step === 'widgets_demo' ? 128 : 88) : Spacing[4]),
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
              {step === 'widgets_demo' ? <OnboardingPinWidget /> : null}
              <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
                <TouchableOpacity
                  style={[styles.ctaFull, { backgroundColor: theme.percent }]}
                  onPress={handleContinue}
                  activeOpacity={0.9}
                >
                  <Text variant="sectionTitle" style={styles.ctaFullLabel}>
                    {step === 'brand'
                      ? t('onboarding.cta.showMe')
                      : step === 'day_demo'
                        ? t('onboarding.cta.next')
                        : step === 'widgets_demo'
                          ? t('onboarding.cta.buildMap')
                          : t('onboarding.cta.continue')}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    justifyContent: 'flex-start',
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
});

export {
  OnboardingCompleteContext,
  useOnboardingComplete,
} from './OnboardingCompleteContext';
