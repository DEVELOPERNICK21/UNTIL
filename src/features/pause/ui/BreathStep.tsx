import React, { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '../../../shared/ui';
import { Spacing, useTheme } from '../../../shared/theme';
import { useReduceMotion } from '../../../shared/ui/useReduceMotion';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import type { BreathPaceName } from '../domain/breathing';
import { useBreathing } from '../hooks/useBreathing';
import { BreathOrb } from './BreathOrb';
import { PauseButton } from './PauseButton';

interface Props {
  pace: BreathPaceName;
  /** Round 1 or 2. The second round says it is slower. */
  round: number;
  onDone: () => void;
}

/**
 * The first thing people see. It starts on its own: someone who is anxious cannot be asked to choose
 * anything yet. No timer is shown, because a countdown is what we are trying to take away.
 */
export function BreathStep({ pace, round, onDone }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const { width } = useWindowDimensions();
  const { phase, canContinue, phaseProgress } = useBreathing({
    pace,
    onRoundComplete: onDone,
    trackProgress: reduceMotion,
  });

  const cue = phase === 'inhale' ? t('pause.breathe.in') : t('pause.breathe.out');

  // Screen readers get the rhythm too: say each word as it changes.
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(enabled => {
      if (enabled) AccessibilityInfo.announceForAccessibility(cue);
    });
  }, [cue]);

  return (
    <View style={styles.root}>
      <View style={styles.orbArea}>
        <BreathOrb pace={pace} reduceMotion={reduceMotion} size={Math.min(width * 0.64, 290)} />
      </View>

      <View
        accessible
        accessibilityLabel={t('pause.breathe.a11y')}
        accessibilityLiveRegion="polite"
        style={styles.words}
      >
        <Text variant="headline" color="primary" style={styles.cue}>
          {cue}
        </Text>
        <Text variant="body" color="secondary" style={styles.hint}>
          {round > 1 ? t('pause.breathe.hintSlow') : t('pause.breathe.hint')}
        </Text>
      </View>

      {reduceMotion ? (
        <View style={[styles.track, { backgroundColor: theme.progressTrack }]}>
          <View
            style={[
              styles.fill,
              { backgroundColor: theme.percent, width: `${Math.round(phaseProgress * 100)}%` },
            ]}
          />
        </View>
      ) : null}

      <View
        style={[styles.footer, !canContinue && styles.hidden]}
        pointerEvents={canContinue ? 'auto' : 'none'}
        accessibilityElementsHidden={!canContinue}
        importantForAccessibility={canContinue ? 'auto' : 'no-hide-descendants'}
      >
        <PauseButton variant="quiet" label={t('common.continue')} onPress={onDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  orbArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  words: {
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    marginBottom: Spacing[3],
  },
  cue: {
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  hint: {
    textAlign: 'center',
  },
  track: {
    height: 4,
    borderRadius: 2,
    marginHorizontal: Spacing[5],
    marginBottom: Spacing[3],
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  footer: {
    minHeight: 54,
  },
  hidden: {
    opacity: 0,
  },
});
