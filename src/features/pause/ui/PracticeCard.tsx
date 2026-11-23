import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Radius, Spacing } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import type { BreathTechniqueId } from '../domain/breathing';
import { practiceById, type PracticeId } from '../domain/practices';
import { CalmText } from './CalmText';
import { CALM } from './calmPalette';
import { EVIDENCE_LABEL, PRACTICE_HOW, PRACTICE_NAME } from './practiceLabels';
import { breathCurvePath } from './practiceIcon';

interface Props {
  practice: PracticeId;
  onPress: () => void;
  /** The pick for this time of day: larger, with a glow. */
  featured?: boolean;
}

/**
 * The practice's icon: a soft orb with the shape of its breath drawn inside (rise, hold, fall). Grounding
 * has no breath, so it shows five dots, one for each thing you name.
 */
function PracticeIcon({ practice, size }: { practice: PracticeId; size: number }) {
  const layer = (ratio: number, opacity: number) => ({
    width: size * ratio,
    height: size * ratio,
    borderRadius: (size * ratio) / 2,
    backgroundColor: CALM.orb,
    opacity,
  });
  const inner = size * 0.5;
  return (
    <View style={[styles.orb, { width: size, height: size }]}>
      <View style={[styles.layer, layer(1, 0.14)]} />
      <View style={[styles.layer, layer(0.74, 0.26)]} />
      <Svg width={inner} height={inner} viewBox="0 0 24 24">
        {practice === 'grounding' ? (
          [4, 8, 12, 16, 20].map((x, i) => (
            <Circle key={x} cx={x} cy={i % 2 === 0 ? 10 : 14} r={1.9} fill={CALM.text} />
          ))
        ) : (
          <Path
            d={breathCurvePath(practice as BreathTechniqueId, 24, 3)}
            stroke={CALM.text}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </Svg>
    </View>
  );
}

export function PracticeCard({ practice, onPress, featured = false }: Props) {
  const { t } = useTranslation();
  const info = practiceById(practice);
  const longest = info.durations[info.durations.length - 1] / 60;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${t(PRACTICE_NAME[practice])}. ${t(PRACTICE_HOW[practice])}`}
      style={({ pressed }) => [styles.card, featured && styles.featured, pressed && styles.pressed]}
    >
      <PracticeIcon practice={practice} size={featured ? 68 : 56} />
      <View style={styles.text}>
        <CalmText variant="body" tone="primary" style={styles.name}>
          {t(PRACTICE_NAME[practice])}
        </CalmText>
        <CalmText variant="caption" tone="secondary" numberOfLines={featured ? 3 : 2}>
          {t(PRACTICE_HOW[practice])}
        </CalmText>
        <View style={styles.meta}>
          <CalmText variant="micro" tone="accent">
            {t(EVIDENCE_LABEL[info.evidence])}
          </CalmText>
          <CalmText variant="micro" tone="muted">
            {info.durations.length > 1
              ? `${t('pause.min', { count: info.durations[0] / 60 })} – ${t('pause.min', { count: longest })}`
              : t('pause.min', { count: info.defaultSeconds / 60 })}
          </CalmText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: CALM.card,
    borderColor: CALM.cardBorder,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing[3],
  },
  featured: {
    borderColor: CALM.accentSoft,
    backgroundColor: CALM.cardSelected,
  },
  pressed: {
    opacity: 0.75,
  },
  orb: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  layer: {
    position: 'absolute',
  },
  text: {
    flex: 1,
  },
  name: {
    marginBottom: 2,
  },
  meta: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: 6,
    flexWrap: 'wrap',
  },
});
