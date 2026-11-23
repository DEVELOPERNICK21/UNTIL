import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Spacing } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import type { Feeling } from '../domain/pauseFlow';
import { CalmButton } from './CalmButton';
import { CalmText } from './CalmText';

interface Props {
  onFeeling: (feeling: Feeling) => void;
}

/** One question, three answers. "Still tight" is a fine answer: it gets another, slower, round. */
export function CheckInStep({ onFeeling }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      <CalmText variant="headline" tone="primary" accessibilityRole="header" style={styles.title}>
        {t('pause.checkin.title')}
      </CalmText>
      <View style={styles.choices}>
        <CalmButton label={t('pause.checkin.calmer')} onPress={() => onFeeling('calmer')} />
        <CalmButton label={t('pause.checkin.same')} onPress={() => onFeeling('same')} />
        <CalmButton label={t('pause.checkin.tight')} onPress={() => onFeeling('tight')} />
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
