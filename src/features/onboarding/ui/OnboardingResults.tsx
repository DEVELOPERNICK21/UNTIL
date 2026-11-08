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
      <Animated.View style={header}>
        <Ember progress={0.88} size={64} />
        <Text
          variant="display"
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
          <ResultCard key={card.id} text={card.text} index={index} />
        ))}
      </View>

      <View style={styles.resultsFooter}>
        <TouchableOpacity
          style={[styles.halfBtn, { borderColor: theme.divider }]}
          onPress={onBack}
          activeOpacity={0.75}
        >
          <Text style={{ color: theme.textPrimary }}>
            {t('onboarding.cta.back')}
          </Text>
        </TouchableOpacity>
        <Animated.View style={[{ flex: 1 }, { transform: [{ scale }] }]}>
          <TouchableOpacity
            style={[
              styles.halfBtnFill,
              {
                backgroundColor: theme.percent,
                borderColor: theme.percent,
              },
            ]}
            onPress={() => {
              bounce();
              onContinue();
            }}
            activeOpacity={0.9}
          >
            <Text
              style={{
                color: '#0E0E10',
                fontFamily: getFontFamilyForWeight(Weight.semibold),
              }}
            >
              {t('onboarding.cta.continue')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

function ResultCard({ text, index }: { text: string; index: number }) {
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
      <Text style={{ color: theme.percent, marginRight: Spacing[2] }}>✓</Text>
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
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
  },
  resultsFooter: {
    flexDirection: 'row',
    gap: Spacing[2],
    width: '100%',
    marginTop: Spacing[4],
    alignItems: 'center',
  },
  halfBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  halfBtnFill: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
});
