/**
 * Interactive welcome beat — Ember + tappable feature chips.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Vibration,
  Animated,
  Easing,
} from 'react-native';
import { Text, PeriodGlyph, Ember } from '../../ui';
import {
  useTheme,
  Spacing,
  Typography,
  Radius,
  Weight,
  getFontFamilyForWeight,
  Shadows,
} from '../../theme';
import { useEnter } from './onboardingMotion';

const FEATURES = [
  {
    id: 'day',
    label: 'Day %',
    glyph: 'day' as const,
    blurb: 'Live ring of today’s passed and left time.',
  },
  {
    id: 'widgets',
    label: 'Widgets',
    glyph: 'month' as const,
    blurb: 'Home screen glances — no app open needed.',
  },
  {
    id: 'life',
    label: 'Life view',
    glyph: 'life' as const,
    blurb: 'Your life progress, once you set a birth date.',
  },
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
  const theme = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const glow = useRef(new Animated.Value(0)).current;
  const brandScale = useRef(new Animated.Value(0.92)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const headline = useEnter(active, 120);
  const body = useEnter(active, 220);
  const chips = useEnter(active, 340);

  useEffect(() => {
    if (!active) return;
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

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, brandScale, brandOpacity, glow]);

  return (
    <View style={styles.hero}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            backgroundColor: theme.percent,
            opacity: glow.interpolate({
              inputRange: [0, 1],
              outputRange: [0.1, 0.22],
            }),
            transform: [
              {
                scale: glow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.92, 1.12],
                }),
              },
            ],
          },
        ]}
      />

      <Animated.View
        style={{ opacity: brandOpacity, transform: [{ scale: brandScale }] }}
      >
        <View style={styles.emberRow}>
          <Ember progress={0.32} size={64} />
        </View>
        <Text variant="micro" style={[styles.eyebrow, { color: theme.percent }]}>
          WELCOME
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
                {f.label}
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
            {FEATURES.find(f => f.id === selected)?.blurb}
          </Text>
        </View>
      ) : (
        <Text
          variant="caption"
          style={[styles.tapCue, { color: theme.textMuted }]}
        >
          Tap a chip to explore · then tap Ember
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: Spacing.lg,
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: '6%',
    alignSelf: 'center',
  },
  emberRow: {
    marginBottom: Spacing.md,
  },
  eyebrow: {
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  brand: {
    fontSize: Typography.large + 8,
    letterSpacing: 4,
    marginBottom: Spacing.md,
  },
  headline: {
    marginBottom: Spacing.md,
    lineHeight: Typography.headline * 1.25,
  },
  body: {
    lineHeight: Typography.body * 1.55,
    marginBottom: Spacing.lg,
    maxWidth: 340,
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  featureChip: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    minWidth: 96,
  },
  featureBlurb: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  tapCue: {
    marginTop: Spacing.md,
  },
});
