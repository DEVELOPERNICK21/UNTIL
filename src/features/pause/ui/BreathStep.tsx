import React, { useEffect, useMemo } from 'react';
import { AccessibilityInfo, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Spacing } from '../../../shared/theme';
import { useReduceMotion } from '../../../shared/ui/useReduceMotion';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { sessionMs, type BreathTechniqueId } from '../domain/breathing';
import { useBreathing } from '../hooks/useBreathing';
import { BreathRing } from './BreathRing';
import { CalmButton } from './CalmButton';
import { CalmText } from './CalmText';
import { CUE_LABEL, PRACTICE_NAME } from './practiceLabels';

interface Props {
  technique: BreathTechniqueId;
  seconds: number;
  /** Round 1 or 2. The second round says it is gentler. */
  round: number;
  /** Called with the seconds practised, at the end or when someone moves on early. */
  onDone: (practisedSeconds: number) => void;
}

/**
 * The first thing people see after "Start" (or at once, for the panic button). It runs on its own:
 * someone who is anxious cannot be asked to choose anything. The ring fills as the minutes pass, the
 * number inside counts the current part of the breath (so 4-7-8 can simply be followed), and there is
 * no total countdown, because a clock running down is what we are trying to take away.
 */
export function BreathStep({ technique, seconds, round, onDone }: Props) {
  const { t } = useTranslation();
  const reduceMotion = useReduceMotion();
  const { width } = useWindowDimensions();
  const totalMs = useMemo(() => sessionMs(technique, seconds), [technique, seconds]);
  const { phase, secondsLeft, canContinue, progress, practisedSeconds } = useBreathing({
    technique,
    totalMs,
    onComplete: onDone,
  });

  const cue = t(CUE_LABEL[phase]);

  // Screen readers get the rhythm too: say each word as it changes.
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(enabled => {
      if (enabled) AccessibilityInfo.announceForAccessibility(cue);
    });
  }, [cue]);

  return (
    <View style={styles.root}>
      <CalmText variant="caption" tone="accent" style={styles.practice}>
        {t(PRACTICE_NAME[technique])}
      </CalmText>

      <View style={styles.ringArea}>
        <BreathRing
          technique={technique}
          reduceMotion={reduceMotion}
          size={Math.min(width * 0.7, 300)}
          progress={progress}
          secondsLeft={secondsLeft}
        />
      </View>

      <View
        accessible
        accessibilityLabel={t('pause.breathe.a11y')}
        accessibilityLiveRegion="polite"
        style={styles.words}
      >
        <CalmText variant="headline" tone="primary" style={styles.cue}>
          {cue}
        </CalmText>
        <CalmText variant="body" tone="secondary" style={styles.hint}>
          {round > 1 ? t('pause.breathe.hintSlow') : t('pause.breathe.hint')}
        </CalmText>
      </View>

      <View
        style={[styles.footer, !canContinue && styles.hidden]}
        pointerEvents={canContinue ? 'auto' : 'none'}
        accessibilityElementsHidden={!canContinue}
        importantForAccessibility={canContinue ? 'auto' : 'no-hide-descendants'}
      >
        <CalmButton variant="quiet" label={t('common.continue')} onPress={() => onDone(practisedSeconds())} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  practice: {
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  ringArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  words: {
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    marginBottom: Spacing[2],
  },
  cue: {
    textAlign: 'center',
    marginBottom: Spacing[1],
  },
  hint: {
    textAlign: 'center',
  },
  footer: {
    minHeight: 54,
    marginBottom: 90,
  },
  hidden: {
    opacity: 0,
  },
});
