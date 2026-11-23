import React, { useCallback, useEffect, useReducer } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { ScreenGradient } from '../../../shared/ui';
import { Spacing, useTheme } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import type { RootStackParamList } from '../../../shared/navigation/types';
import { logAnalyticsEvent } from '../../../shared/analytics/analytics';
import { useKeepScreenAwake } from '../../../shared/hooks/useKeepScreenAwake';
import { initialPauseState, pauseReducer } from '../domain/pauseFlow';
import { BreathStep } from './BreathStep';
import { CheckInStep } from './CheckInStep';
import { CloseStep } from './CloseStep';
import { FadeIn } from './FadeIn';
import { LoadPath } from './LoadPath';
import { ReframePath } from './ReframePath';
import { WeightStep } from './WeightStep';

/**
 * Pause: a minute to settle, then, only if you want it, one small step.
 *
 * Nothing is stored. Two anonymous events are logged (started, finished); what someone picked, and how
 * they said they felt, never leave this screen.
 */
export function PauseScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Pause'>>();
  const [state, dispatch] = useReducer(pauseReducer, initialPauseState);

  // Only the breathing needs the screen to stay on; the rest is a tap at a time.
  useKeepScreenAwake(state.step === 'breathe');

  useEffect(() => {
    logAnalyticsEvent('pause_started').catch(() => {});
  }, []);

  useEffect(() => {
    if (state.step === 'close') logAnalyticsEvent('pause_completed').catch(() => {});
  }, [state.step]);

  const close = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Home');
  }, [navigation]);

  const onBreathDone = useCallback(() => dispatch({ type: 'breathDone' }), []);

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <View
          style={[
            styles.page,
            {
              paddingTop: insets.top + Spacing[2],
              paddingBottom: Math.max(insets.bottom, Spacing[3]) + Spacing[2],
            },
          ]}
        >
          <Pressable
            onPress={close}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('pause.close.a11y')}
            style={styles.closeButton}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d="M6 6l12 12M18 6L6 18"
                stroke={theme.textSecondary}
                strokeWidth={1.8}
                strokeLinecap="round"
              />
            </Svg>
          </Pressable>

          <FadeIn key={`${state.step}-${state.round}`}>
            {state.step === 'breathe' ? (
              <BreathStep pace={state.pace} round={state.round} onDone={onBreathDone} />
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
              <CloseStep focus={state.focus} stillTight={state.stillTight} onClose={close} />
            ) : null}
          </FadeIn>
        </View>
      </ScreenGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
