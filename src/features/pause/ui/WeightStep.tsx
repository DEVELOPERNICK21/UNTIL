import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Spacing } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import type { TranslationKey } from '../../../shared/i18n/translate';
import { WEIGHTS, type Weight } from '../domain/pauseFlow';
import { CalmButton } from './CalmButton';
import { CalmText } from './CalmText';

const LABELS: Record<Weight, TranslationKey> = {
  load: 'pause.weight.load',
  time: 'pause.weight.time',
  event: 'pause.weight.event',
  night: 'pause.weight.night',
  unsure: 'pause.weight.unsure',
};

interface Props {
  /** `null` is "skip". */
  onWeight: (weight: Weight | null) => void;
}

/** Only now, once the body has had a minute, does the app ask what the worry is about. */
export function WeightStep({ onWeight }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      <CalmText variant="headline" tone="primary" accessibilityRole="header" style={styles.title}>
        {t('pause.weight.title')}
      </CalmText>
      <CalmText variant="body" tone="secondary" style={styles.subtitle}>
        {t('pause.weight.subtitle')}
      </CalmText>
      <View style={styles.choices}>
        {WEIGHTS.map(weight => (
          <CalmButton key={weight} label={t(LABELS[weight])} onPress={() => onWeight(weight)} />
        ))}
        <CalmButton variant="quiet" label={t('pause.weight.skip')} onPress={() => onWeight(null)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing[1],
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing[3],
  },
  choices: {
    gap: Spacing[2],
  },
});
