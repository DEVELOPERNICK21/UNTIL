import React, { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Radius, Spacing } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import type { TranslationKey } from '../../../shared/i18n/translate';
import { CalmButton } from './CalmButton';
import { CalmText } from './CalmText';
import { CALM } from './calmPalette';

const SENSES: Array<{ count: number; prompt: TranslationKey }> = [
  { count: 5, prompt: 'pause.ground.see' },
  { count: 4, prompt: 'pause.ground.touch' },
  { count: 3, prompt: 'pause.ground.hear' },
  { count: 2, prompt: 'pause.ground.smell' },
  { count: 1, prompt: 'pause.ground.taste' },
];

interface Props {
  /** Called with the seconds spent, when the last sense is done. */
  onDone: (practisedSeconds: number) => void;
}

/**
 * 5-4-3-2-1 grounding: name five things you can see, four you can feel, and so on down to one. Tapping
 * each one makes the attention physical, which is the point: it pulls the mind back out of the spiral and
 * into the room.
 */
export function GroundingStep({ onDone }: Props) {
  const { t } = useTranslation();
  const startedAt = useRef(Date.now());
  const [stage, setStage] = useState(0);
  const [tapped, setTapped] = useState(0);

  const sense = SENSES[stage];
  const complete = tapped >= sense.count;
  const dots = useMemo(() => Array.from({ length: sense.count }, (_, i) => i), [sense.count]);

  const next = () => {
    if (stage === SENSES.length - 1) {
      onDone(Math.round((Date.now() - startedAt.current) / 1000));
      return;
    }
    setStage(stage + 1);
    setTapped(0);
  };

  return (
    <View style={styles.root}>
      <CalmText variant="caption" tone="accent" style={styles.progress}>
        {t('pause.ground.progress', { done: stage + 1, total: SENSES.length })}
      </CalmText>

      <View style={styles.middle}>
        <CalmText variant="headline" tone="primary" accessibilityRole="header" style={styles.title}>
          {t(sense.prompt)}
        </CalmText>
        <CalmText variant="body" tone="secondary" style={styles.tap}>
          {t('pause.ground.tap')}
        </CalmText>

        <View style={styles.dots}>
          {dots.map(i => {
            const filled = i < tapped;
            return (
              <Pressable
                key={`${stage}-${i}`}
                onPress={() => setTapped(current => Math.max(current, i + 1))}
                accessibilityRole="button"
                accessibilityLabel={`${i + 1} / ${sense.count}`}
                accessibilityState={{ selected: filled }}
                style={[styles.dot, filled && styles.dotFilled]}
              >
                {filled ? <View style={styles.dotCore} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.footer, !complete && styles.hidden]} pointerEvents={complete ? 'auto' : 'none'}>
        <CalmButton variant="solid" label={t('common.continue')} onPress={next} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  progress: {
    textAlign: 'center',
    letterSpacing: 1,
  },
  middle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing[1],
  },
  tap: {
    textAlign: 'center',
    marginBottom: Spacing[5],
  },
  dots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing[3],
  },
  dot: {
    width: 58,
    height: 58,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: CALM.cardBorder,
    backgroundColor: CALM.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotFilled: {
    borderColor: CALM.accent,
    backgroundColor: CALM.cardSelected,
  },
  dotCore: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: CALM.orb,
  },
  footer: {
    minHeight: 54,
  },
  hidden: {
    opacity: 0,
  },
});
