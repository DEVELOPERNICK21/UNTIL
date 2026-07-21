/**
 * Visual Premium feature tiles — icon + short label (scan, don’t read).
 */

import React from 'react';
import { View, StyleSheet, Pressable, Vibration } from 'react-native';
import { Text, PeriodGlyph, type PeriodGlyphKind } from '../../ui';
import {
  useTheme,
  Spacing,
  Radius,
  Weight,
  getFontFamilyForWeight,
} from '../../theme';

type FeatureTile = {
  id: string;
  label: string;
  blurb: string;
  glyph: PeriodGlyphKind;
  progress: number;
  featured?: boolean;
};

const FEATURES: FeatureTile[] = [
  {
    id: 'life',
    label: 'Life view',
    blurb: 'Full life % and weeks. Always visible.',
    glyph: 'life',
    progress: 0.58,
    featured: true,
  },
  {
    id: 'month',
    label: 'Month widget',
    blurb: 'See the month pass on your home screen.',
    glyph: 'month',
    progress: 0.42,
  },
  {
    id: 'overlay',
    label: 'Overlay',
    blurb: 'Month & life float above other apps.',
    glyph: 'day',
    progress: 0.7,
  },
  {
    id: 'alerts',
    label: 'Lost-time alerts',
    blurb: 'A nudge when wasted hours cross your limit.',
    glyph: 'year',
    progress: 0.33,
  },
];

interface PaywallFeatureTilesProps {
  onSelect?: (id: string) => void;
}

export function PaywallFeatureTiles({ onSelect }: PaywallFeatureTilesProps) {
  const theme = useTheme();
  const [selected, setSelected] = React.useState<string | null>('life');

  const active = FEATURES.find(f => f.id === selected) ?? FEATURES[0];

  return (
    <View style={styles.wrap}>
      <Text
        variant="caption"
        style={[
          styles.heading,
          {
            color: theme.textSecondary,
            fontFamily: getFontFamilyForWeight(Weight.medium),
          },
        ]}
      >
        What you keep with Premium
      </Text>

      <View style={styles.grid}>
        {FEATURES.map(f => {
          const on = selected === f.id;
          return (
            <Pressable
              key={f.id}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${f.label}. ${f.blurb}`}
              onPress={() => {
                Vibration.vibrate(8);
                setSelected(f.id);
                onSelect?.(f.id);
              }}
              style={[
                styles.tile,
                f.featured ? styles.tileFeatured : styles.tileHalf,
                {
                  borderColor: on ? theme.percent : theme.glassBorder,
                  backgroundColor: on
                    ? 'rgba(232, 124, 32, 0.14)'
                    : theme.glassBg,
                  transform: [{ scale: on ? 1.02 : 1 }],
                  minHeight: f.featured ? 108 : 96,
                },
              ]}
            >
              <PeriodGlyph
                kind={f.glyph}
                size={f.featured ? 40 : 32}
                progress={f.progress}
                pressed={on}
                animated
              />
              <Text
                variant="caption"
                style={{
                  color: on ? theme.percent : theme.textPrimary,
                  marginTop: Spacing[1],
                  textAlign: 'center',
                  fontFamily: getFontFamilyForWeight(Weight.medium),
                }}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {active ? (
        <View
          style={[
            styles.blurb,
            {
              borderColor: theme.glassBorder,
              backgroundColor: theme.glassBg,
            },
          ]}
          accessibilityLiveRegion="polite"
        >
          <Text variant="body" style={{ color: theme.textSecondary }}>
            {active.blurb}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing[4],
  },
  heading: {
    letterSpacing: 0.4,
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    justifyContent: 'space-between',
  },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[2],
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 96,
  },
  tileFeatured: {
    width: '100%',
    borderRadius: Radius.lg,
    flexDirection: 'row',
    gap: Spacing[3],
    paddingHorizontal: Spacing[4],
  },
  tileHalf: {
    width: '31%',
  },
  blurb: {
    marginTop: Spacing[2],
    padding: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
  },
});
