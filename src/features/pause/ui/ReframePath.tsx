import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Radius, Spacing } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import type { TranslationKey } from '../../../shared/i18n/translate';
import type { Weight } from '../domain/pauseFlow';
import { CalmButton } from './CalmButton';
import { CalmText } from './CalmText';
import { CALM } from './calmPalette';

type ReframeWeight = Exclude<Weight, 'load'>;

const COPY: Record<ReframeWeight, { title: TranslationKey; body: TranslationKey; step: TranslationKey }> = {
  time: { title: 'pause.time.title', body: 'pause.time.body', step: 'pause.time.step' },
  event: { title: 'pause.event.title', body: 'pause.event.body', step: 'pause.event.step' },
  night: { title: 'pause.night.title', body: 'pause.night.body', step: 'pause.night.step' },
  unsure: { title: 'pause.unsure.title', body: 'pause.unsure.body', step: 'pause.unsure.step' },
};

interface Props {
  weight: ReframeWeight;
  onDone: () => void;
}

/**
 * The other four weights: say the feeling back kindly, offer one thing to do with it, and let go.
 * Nothing here hides a number or tells anyone to calm down. It only makes the worry smaller than the
 * moment it came in.
 */
export function ReframePath({ weight, onDone }: Props) {
  const { t } = useTranslation();
  const copy = COPY[weight];
  return (
    <View style={styles.root}>
      <CalmText variant="headline" tone="primary" accessibilityRole="header" style={styles.title}>
        {t(copy.title)}
      </CalmText>
      <CalmText variant="body" tone="secondary" style={styles.body}>
        {t(copy.body)}
      </CalmText>
      <View style={styles.step}>
        <CalmText variant="body" tone="primary">
          {t(copy.step)}
        </CalmText>
      </View>
      <View style={styles.actions}>
        <CalmButton variant="solid" label={t('common.continue')} onPress={onDone} />
        <CalmButton variant="quiet" label={t('common.notNow')} onPress={onDone} />
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
    marginBottom: Spacing[2],
  },
  body: {
    textAlign: 'center',
    marginBottom: Spacing[3],
  },
  step: {
    backgroundColor: CALM.card,
    borderColor: CALM.cardBorder,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing[3],
    marginBottom: Spacing[3],
  },
  actions: {
    gap: Spacing[1],
  },
});
