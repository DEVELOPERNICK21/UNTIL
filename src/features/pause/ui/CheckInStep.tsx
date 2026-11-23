import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../../shared/ui';
import { Spacing } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import type { Feeling } from '../domain/pauseFlow';
import { PauseButton } from './PauseButton';

interface Props {
  onFeeling: (feeling: Feeling) => void;
}

/** One question, three answers. "Still tight" is a fine answer: it gets another, slower, round. */
export function CheckInStep({ onFeeling }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      <Text variant="headline" color="primary" accessibilityRole="header" style={styles.title}>
        {t('pause.checkin.title')}
      </Text>
      <View style={styles.choices}>
        <PauseButton label={t('pause.checkin.calmer')} onPress={() => onFeeling('calmer')} />
        <PauseButton label={t('pause.checkin.same')} onPress={() => onFeeling('same')} />
        <PauseButton label={t('pause.checkin.tight')} onPress={() => onFeeling('tight')} />
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
    marginBottom: Spacing[4],
  },
  choices: {
    gap: Spacing[2],
  },
});
