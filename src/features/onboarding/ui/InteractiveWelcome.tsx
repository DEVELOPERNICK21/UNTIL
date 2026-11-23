/**
 * Interactive welcome beat — Ember + tappable feature chips.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Vibration, Animated } from 'react-native';
import { Text, PeriodGlyph, Ember } from '../../../shared/ui';
import {
  useTheme,
  Spacing,
  Typography,
  Radius,
  Weight,
  getFontFamilyForWeight,
  Shadows,
} from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useEnter } from './onboardingMotion';
import { useReduceMotion } from '../../../shared/ui/useReduceMotion';
import { WelcomeGlow } from './WelcomeGlow';

type FeatureId = 'day' | 'widgets' | 'life';

const FEATURES: { id: FeatureId; glyph: 'day' | 'month' | 'life' }[] = [
  { id: 'day', glyph: 'day' },
  { id: 'widgets', glyph: 'month' },
  { id: 'life', glyph: 'life' },
];

interface InteractiveWelcomeProps {
  active: boolean;
  title: string;
  subtitle: string;
}

export function InteractiveWelcome({
  active,
  title,
  subtitle,
}: InteractiveWelcomeProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const [selected, setSelected] = useState<FeatureId | null>(null);
  const brandScale = useRef(new Animated.Value(0.92)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const headline = useEnter(active, 120);
  const body = useEnter(active, 220);
  const chips = useEnter(active, 340);

  useEffect(() => {
    if (!active) {
      brandScale.setValue(0.92);
      brandOpacity.setValue(0);
      return;
    }
    if (reduceMotion) {
      brandScale.setValue(1);
      brandOpacity.setValue(1);
      return;
    }
    Animated.parallel([
      Animated.spring(brandScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(brandOpacity, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
      }),
    ]).start();
  }, [active, brandScale, brandOpacity, reduceMotion]);

  return (
    <View style={styles.hero}>
      <Animated.View
        style={[
          styles.brandBlock,
          { opacity: brandOpacity, transform: [{ scale: brandScale }] },
        ]}
      >
        <View style={styles.emberRow}>
          <WelcomeGlow active={active} />
          <Ember progress={0.32} size={84} />
        </View>
        <Text variant="micro" style={[styles.eyebrow, { color: theme.percent }]}>
          {t('onboarding.welcome.eyebrow')}
        </Text>
        <Text
          variant="display"
          style={[
            styles.brand,
            {
              color: theme.textPrimary,
              fontFamily: getFontFamilyForWeight(Weight.bold),
            },
          ]}
        >
          UNTIL
        </Text>
      </Animated.View>

      <Animated.View style={headline}>
        <Text
          variant="headline"
          style={[styles.headline, { color: theme.textPrimary }]}
        >
          {title}
        </Text>
      </Animated.View>

      <Animated.View style={body}>
        <Text
          variant="body"
          style={[styles.body, { color: theme.textSecondary }]}
        >
          {subtitle}
        </Text>
      </Animated.View>

      <Animated.View style={[styles.featureRow, chips]}>
        {FEATURES.map((f, i) => {
          const on = selected === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => {
                Vibration.vibrate(8);
                setSelected(on ? null : f.id);
              }}
              style={[
                styles.featureChip,
                {
                  borderColor: on ? theme.percent : theme.glassBorder,
                  backgroundColor: on
                    ? 'rgba(232, 124, 32, 0.14)'
                    : theme.glassBg,
                  transform: [{ scale: on ? 1.04 : 1 }],
                },
                Shadows.card,
              ]}
            >
              <PeriodGlyph
                kind={f.glyph}
                size={28}
                progress={0.35 + i * 0.18}
                pressed={on}
                animated={active}
              />
              <Text
                variant="caption"
                style={{
                  color: on ? theme.percent : theme.textPrimary,
                  marginTop: 6,
                  fontFamily: getFontFamilyForWeight(Weight.medium),
                }}
              >
                {t(`onboarding.welcome.${f.id}.label`)}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>

      {selected ? (
        <View
          style={[
            styles.featureBlurb,
            {
              borderColor: theme.glassBorder,
              backgroundColor: theme.glassBg,
            },
          ]}
        >
          <Text variant="body" style={{ color: theme.textSecondary }}>
            {t(`onboarding.welcome.${selected}.blurb`)}
          </Text>
        </View>
      ) : (
        <Text
          variant="caption"
          style={[styles.tapCue, { color: theme.textMuted }]}
        >
          {t('onboarding.welcome.tapCue')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Spacing.lg,
  },
  brandBlock: {
    alignItems: 'center',
  },
  emberRow: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 240,
    height: 240,
    marginBottom: Spacing.xs,
  },
  eyebrow: {
    letterSpacing: 2,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  brand: {
    fontSize: Typography.large + 8,
    letterSpacing: 4,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  headline: {
    marginBottom: Spacing.md,
    lineHeight: Typography.headline * 1.25,
    textAlign: 'center',
  },
  body: {
    lineHeight: Typography.body * 1.55,
    marginBottom: Spacing.xl,
    maxWidth: 340,
    textAlign: 'center',
    alignSelf: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: Spacing.sm,
  },
  featureChip: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  featureBlurb: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  tapCue: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});
