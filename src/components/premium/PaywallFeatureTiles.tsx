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
};

const FEATURES: FeatureTile[] = [
  {
    id: 'month',
    label: 'Month widget',
    blurb: 'See the month pass on your home screen.',
    glyph: 'month',
    progress: 0.42,
  },
  {
    id: 'life',
    label: 'Life view',
    blurb: 'Full life % and weeks — always visible.',
    glyph: 'life',
    progress: 0.58,
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
    label: 'Awareness',
    blurb: 'Gentle nudges when time slips away.',
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

  const active = FEATURES.find(f => f.id === selected) ?? FEATURES[1];

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
        WHAT YOU KEEP WITH PREMIUM
      </Text>

      <View style={styles.grid}>
        {FEATURES.map(f => {
          const on = selected === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => {
                Vibration.vibrate(8);
                setSelected(f.id);
                onSelect?.(f.id);
              }}
              style={[
                styles.tile,
                {
                  borderColor: on ? theme.percent : theme.glassBorder,
                  backgroundColor: on
                    ? 'rgba(232, 124, 32, 0.14)'
                    : theme.glassBg,
                  transform: [{ scale: on ? 1.03 : 1 }],
                },
              ]}
            >
              <PeriodGlyph
                kind={f.glyph}
                size={32}
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
    letterSpacing: 1.2,
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
    width: '47%',
    alignItems: 'center',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[2],
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  blurb: {
    marginTop: Spacing[2],
    padding: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
  },
});
