import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GlassCard, Text } from '../../../shared/ui';
import { Spacing } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import type { TranslationKey } from '../../../shared/i18n/translate';
import type { Weight } from '../domain/pauseFlow';
import { PauseButton } from './PauseButton';

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
      <Text variant="headline" color="primary" accessibilityRole="header" style={styles.title}>
        {t(copy.title)}
      </Text>
      <Text variant="body" color="secondary" style={styles.body}>
        {t(copy.body)}
      </Text>
      <GlassCard style={styles.step}>
        <Text variant="body" color="primary">
          {t(copy.step)}
        </Text>
      </GlassCard>
      <View style={styles.actions}>
        <PauseButton label={t('common.continue')} onPress={onDone} />
        <PauseButton variant="quiet" label={t('common.notNow')} onPress={onDone} />
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
    marginBottom: Spacing[3],
  },
  actions: {
    gap: Spacing[1],
  },
});
