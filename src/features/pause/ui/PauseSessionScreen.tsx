import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Pressable, StatusBar, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Spacing } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import type { RootStackParamList } from '../../../shared/navigation/types';
import { logAnalyticsEvent } from '../../../shared/analytics/analytics';
import { useKeepScreenAwake } from '../../../shared/hooks/useKeepScreenAwake';
import { initialPauseState, pauseReducer } from '../domain/pauseFlow';
import { practiceById } from '../domain/practices';
import type { BreathTechniqueId } from '../domain/breathing';
import type { RecordedSession } from '../domain/useCases/RecordPauseSessionUseCase';
import { usePauseProgress } from '../hooks/usePauseProgress';
import { BreathStep } from './BreathStep';
import { CalmBackdrop } from './CalmBackdrop';
import { CheckInStep } from './CheckInStep';
import { CloseStep } from './CloseStep';
import { FadeIn } from './FadeIn';
import { GroundingStep } from './GroundingStep';
import { LoadPath } from './LoadPath';
import { ReadyStep } from './ReadyStep';
import { ReframePath } from './ReframePath';
import { WeightStep } from './WeightStep';
import { CALM } from './calmPalette';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PauseSession'>;

/**
 * One Pause session: ready, practise, check in, what feels heavy, one small step, close.
 *
 * Only calm minutes are stored (on this phone). What someone picked, and how they said they felt, never
 * leave this screen. Two anonymous events are logged, started and finished, with no details.
 */
export function PauseSessionScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<RouteProp<RootStackParamList, 'PauseSession'>>();
  const [state, dispatch] = useReducer(pauseReducer, undefined, () =>
    initialPauseState(params.practice, params.instant === true),
  );
  const { record } = usePauseProgress();
  const [result, setResult] = useState<RecordedSession | null>(null);
  const recorded = useRef(false);

  // Only the practising needs the screen to stay on; the rest is a tap at a time.
  useKeepScreenAwake(state.step === 'breathe');

  useEffect(() => {
    logAnalyticsEvent('pause_started').catch(() => {});
  }, []);

  useEffect(() => {
    if (state.step !== 'close' || recorded.current) return;
    recorded.current = true;
    setResult(record(params.practice, state.practiceSeconds));
    logAnalyticsEvent('pause_completed').catch(() => {});
  }, [state.step, state.practiceSeconds, params.practice, record]);

  const back = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Pause');
  }, [navigation]);

  const leave = useCallback(() => {
    if (navigation.canGoBack()) navigation.popToTop();
    else navigation.navigate('Home');
  }, [navigation]);

  const onPracticeDone = useCallback((seconds: number) => dispatch({ type: 'practiceDone', seconds }), []);
  const breathing = state.step === 'breathe' && practiceById(state.practice).kind === 'breath';

  return (
    <CalmBackdrop wave={breathing}>
      <StatusBar barStyle="light-content" />
      <View
        style={[
          styles.page,
          { paddingTop: insets.top + Spacing[2], paddingBottom: Math.max(insets.bottom, Spacing[3]) + Spacing[2] },
        ]}
      >
        <Pressable
          onPress={back}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('pause.close.a11y')}
          style={styles.closeButton}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M6 6l12 12M18 6L6 18" stroke={CALM.textSecondary} strokeWidth={1.8} strokeLinecap="round" />
          </Svg>
        </Pressable>

        <FadeIn key={`${state.step}-${state.round}`}>
          {state.step === 'ready' ? (
            <ReadyStep practice={state.practice} onStart={seconds => dispatch({ type: 'start', seconds })} />
          ) : null}
          {state.step === 'breathe' && state.practice === 'grounding' ? (
            <GroundingStep onDone={onPracticeDone} />
          ) : null}
          {state.step === 'breathe' && state.practice !== 'grounding' ? (
            <BreathStep
              technique={state.practice as BreathTechniqueId}
              seconds={state.seconds}
              round={state.round}
              onDone={onPracticeDone}
            />
          ) : null}
          {state.step === 'checkIn' ? (
            <CheckInStep onFeeling={feeling => dispatch({ type: 'feeling', feeling })} />
          ) : null}
          {state.step === 'weight' ? (
            <WeightStep onWeight={weight => dispatch({ type: 'weight', weight })} />
          ) : null}
          {state.step === 'path' && state.weight === 'load' ? (
            <LoadPath onDone={focus => dispatch({ type: 'pathDone', focus })} />
          ) : null}
          {state.step === 'path' && state.weight && state.weight !== 'load' ? (
            <ReframePath weight={state.weight} onDone={() => dispatch({ type: 'pathDone' })} />
          ) : null}
          {state.step === 'close' ? (
            <CloseStep
              focus={state.focus}
              stillTight={state.stillTight}
              result={result}
              onBack={back}
              onLeave={leave}
            />
          ) : null}
        </FadeIn>
      </View>
    </CalmBackdrop>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: Spacing[4],
  },
  closeButton: {
    alignSelf: 'flex-start',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -Spacing[2],
  },
});
