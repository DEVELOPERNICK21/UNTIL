/**
 * The "Your time map is ready" beat that closes the onboarding quiz.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Text, Ember } from '../../../shared/ui';
import {
  useTheme,
  Spacing,
  Weight,
  getFontFamilyForWeight,
  Radius,
} from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useCtaPressScale, useEnter } from './onboardingMotion';

export function ResultsBeat({
  cards,
  onBack,
  onContinue,
}: {
  cards: { id: string; text: string }[];
  onBack: () => void;
  onContinue: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const header = useEnter(true, 40);
  const { scale, bounce } = useCtaPressScale();

  return (
    <View style={styles.resultsBlock}>
      <Animated.View style={[styles.header, header]}>
        <Ember progress={0.88} size={72} />
        <Text
          variant="display"
          accessibilityRole="header"
          style={[
            styles.title,
            {
              color: theme.textPrimary,
              marginTop: Spacing[3],
              fontFamily: getFontFamilyForWeight(Weight.bold),
            },
          ]}
        >
          {t('onboarding.prompt.resultsTitle')}
        </Text>
        <Text
          variant="body"
          style={[styles.subtitle, { color: theme.textSecondary }]}
        >
          {t('onboarding.prompt.resultsSub')}
        </Text>
      </Animated.View>

      <View style={styles.cards}>
        {cards.map((card, index) => (
          <ResultCard key={card.id} id={card.id} text={card.text} index={index} />
        ))}
      </View>

      <View style={styles.resultsFooter}>
        <Animated.View style={[styles.fullWidth, { transform: [{ scale }] }]}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.percent }]}
            onPress={() => {
              bounce();
              onContinue();
            }}
            activeOpacity={0.9}
            accessibilityRole="button"
          >
            <Text
              variant="sectionTitle"
              style={{
                color: '#0E0E10',
                fontFamily: getFontFamilyForWeight(Weight.semibold),
              }}
            >
              {t('onboarding.cta.continue')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
        <TouchableOpacity
          style={styles.backLink}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <Text variant="body" style={{ color: theme.textSecondary }}>
            {t('onboarding.cta.back')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** One small picture per result, so the three lines read as three separate wins. */
const RESULT_EMOJI: Record<string, string> = {
  reclaim: '⏳',
  plan: '🎯',
  cadence: '📲',
};

function ResultCard({ id, text, index }: { id: string; text: string; index: number }) {
  const theme = useTheme();
  const enter = useEnter(true, 120 + index * 90);

  return (
    <Animated.View
      style={[
        styles.resultCard,
        enter,
        {
          backgroundColor: theme.cardBase,
          borderColor: theme.divider,
        },
      ]}
    >
      <View style={[styles.resultBadge, { backgroundColor: theme.cardLighter }]}>
        <Text style={styles.resultEmoji}>{RESULT_EMOJI[id] ?? '✓'}</Text>
      </View>
      <Text
        variant="body"
        style={{
          color: theme.textPrimary,
          flex: 1,
          fontFamily: getFontFamilyForWeight(Weight.medium),
        }}
      >
        {text}
      </Text>
      <Text style={{ color: theme.percent, marginLeft: Spacing[2] }}>✓</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingTop: Spacing[4],
  },
  title: {
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  primaryBtn: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing[3],
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLink: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[3],
  },
  resultEmoji: {
    fontSize: 20,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  resultsBlock: {
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[4],
  },
  cards: {
    width: '100%',
    gap: Spacing[2],
    marginTop: Spacing[2],
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
    minHeight: 64,
  },
  resultsFooter: {
    width: '100%',
    marginTop: Spacing[4],
    gap: Spacing[1],
  },
});
