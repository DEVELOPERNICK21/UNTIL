/**
 * "On your home screen" — the person's own numbers, with the widgets Premium adds shown next to
 * the one that is already free. Shows their real figures, so the paywall is about them.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../../shared/ui';
import { useObserveTimeState } from '../../time';
import {
  useTheme,
  Spacing,
  Radius,
  Weight,
  getFontFamilyForWeight,
} from '../../../shared/theme';
import { buildYourNumbers } from '../domain/yourNumbers';

export function PaywallYourNumbers() {
  const theme = useTheme();
  const { timeState, userProfile } = useObserveTimeState();

  const rows = useMemo(
    () =>
      buildYourNumbers(
        timeState,
        !!userProfile.birthDate,
        new Date().toLocaleString(undefined, { month: 'long' }),
      ),
    [timeState, userProfile.birthDate],
  );

  return (
    <View
      style={[styles.card, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}
      accessibilityLabel="Your numbers right now"
    >
      <Text
        variant="caption"
        style={[
          styles.heading,
          { color: theme.textSecondary, fontFamily: getFontFamilyForWeight(Weight.medium) },
        ]}
      >
        YOUR NUMBERS RIGHT NOW
      </Text>
      {rows.map(row => (
        <View key={row.id} style={styles.row}>
          <View style={styles.left}>
            <Text variant="body" style={{ color: theme.textPrimary }}>
              {row.label}
            </Text>
            <Text variant="caption" style={{ color: theme.textSecondary }}>
              {row.premium
                ? row.percent == null
                  ? `${row.widget} · add your birth date to see it`
                  : `${row.widget} · Premium`
                : `${row.widget} · free`}
            </Text>
          </View>
          <Text
            variant="title"
            style={{
              color: row.premium ? theme.textSecondary : theme.percent,
              fontFamily: getFontFamilyForWeight(Weight.semibold),
              opacity: row.premium ? 0.75 : 1,
            }}
          >
            {row.percent == null ? '—' : `${row.percent}%`}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing[3],
    marginBottom: Spacing[4],
    gap: Spacing[2],
  },
  heading: {
    letterSpacing: 1,
    marginBottom: Spacing[1],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flex: 1, paddingRight: Spacing[3] },
});
