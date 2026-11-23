import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Radius, Spacing } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { practiceById, type PracticeId } from '../domain/practices';
import { CalmButton } from './CalmButton';
import { CalmText } from './CalmText';
import { CALM } from './calmPalette';
import { EVIDENCE_LABEL, PRACTICE_HOW, PRACTICE_NAME } from './practiceLabels';

interface Props {
  practice: PracticeId;
  onStart: (seconds: number) => void;
}

/** Before a practice that was chosen (not the panic button): what it is, how strong the evidence is, how long. */
export function ReadyStep({ practice, onStart }: Props) {
  const { t } = useTranslation();
  const info = practiceById(practice);
  const [seconds, setSeconds] = useState(info.defaultSeconds);

  return (
    <View style={styles.root}>
      <View style={styles.message}>
        <View style={styles.pill}>
          <CalmText variant="micro" tone="accent">
            {t(EVIDENCE_LABEL[info.evidence])}
          </CalmText>
        </View>
        <CalmText variant="headline" tone="primary" accessibilityRole="header" style={styles.title}>
          {t(PRACTICE_NAME[practice])}
        </CalmText>
        <CalmText variant="body" tone="secondary" style={styles.how}>
          {t(PRACTICE_HOW[practice])}
        </CalmText>

        {info.durations.length > 1 ? (
          <View style={styles.lengthBlock}>
            <CalmText variant="caption" tone="muted" style={styles.lengthLabel}>
              {t('pause.ready.length')}
            </CalmText>
            <View style={styles.chips} accessibilityRole="radiogroup">
              {info.durations.map(option => {
                const selected = option === seconds;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setSeconds(option)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={t('pause.min', { count: option / 60 })}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <CalmText variant="body" tone={selected ? 'accent' : 'secondary'}>
                      {t('pause.min', { count: option / 60 })}
                    </CalmText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>

      <CalmButton variant="solid" label={t('pause.ready.start')} onPress={() => onStart(seconds)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  message: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pill: {
    borderWidth: 1,
    borderColor: CALM.accentSoft,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    marginBottom: Spacing[3],
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  how: {
    textAlign: 'center',
    paddingHorizontal: Spacing[2],
  },
  lengthBlock: {
    marginTop: Spacing[5],
    alignItems: 'center',
  },
  lengthLabel: {
    marginBottom: Spacing[2],
  },
  chips: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  chip: {
    minWidth: 84,
    minHeight: 46,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: CALM.cardBorder,
    backgroundColor: CALM.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[3],
  },
  chipSelected: {
    borderColor: CALM.accent,
    backgroundColor: CALM.cardSelected,
  },
});
