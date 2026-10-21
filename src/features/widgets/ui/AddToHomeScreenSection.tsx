/**
 * "Add to home screen" on the Widgets screen: one tap per widget on Android launchers that
 * support it. Hidden everywhere else, where the long-press hint under the list still applies.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GlassCard, PinWidgetButton, Text } from '../../../shared/ui';
import { Spacing, useTheme } from '../../../shared/theme';
import { usePinWidget } from '../../../shared/platform/usePinWidget';
import type { PinWidgetKind } from '../../../shared/platform/widgetPin';

interface PinRowProps {
  kind: PinWidgetKind;
  title: string;
  detail: string;
  locked: boolean;
  last: boolean;
  onLocked: () => void;
}

function PinRow({ kind, title, detail, locked, last, onLocked }: PinRowProps) {
  const theme = useTheme();
  const { available, busy, pin } = usePinWidget(kind, 'widget_screen');
  if (!available) return null;
  return (
    <View
      style={[
        styles.row,
        !last && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.glassBorder,
        },
      ]}
    >
      <View style={styles.rowText}>
        <Text variant="body" style={{ color: theme.textPrimary }}>
          {title}
        </Text>
        <Text variant="caption" style={{ color: theme.textSecondary }}>
          {locked ? 'Premium' : detail}
        </Text>
      </View>
      <PinWidgetButton
        variant="link"
        label={locked ? 'See Premium' : 'Add'}
        busy={busy}
        onPress={() => {
          if (locked) {
            onLocked();
          } else {
            void pin();
          }
        }}
      />
    </View>
  );
}

export function AddToHomeScreenSection({
  premium,
  onLocked,
}: {
  premium: boolean;
  onLocked: () => void;
}) {
  const theme = useTheme();
  const { available } = usePinWidget('day', 'widget_screen');
  if (!available) return null;
  return (
    <View style={styles.section}>
      <Text
        variant="caption"
        color="secondary"
        style={[styles.label, { color: theme.textSecondary }]}
      >
        ADD TO HOME SCREEN
      </Text>
      <GlassCard style={styles.card}>
        <PinRow
          kind="day"
          title="Day"
          detail="Today, live"
          locked={false}
          last={false}
          onLocked={onLocked}
        />
        <PinRow
          kind="year"
          title="Year"
          detail="This year so far"
          locked={false}
          last={false}
          onLocked={onLocked}
        />
        <PinRow
          kind="month"
          title="Month"
          detail="This month so far"
          locked={!premium}
          last={false}
          onLocked={onLocked}
        />
        <PinRow
          kind="life"
          title="Life"
          detail="Your life in weeks"
          locked={!premium}
          last
          onLocked={onLocked}
        />
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: Spacing[3] },
  label: {
    letterSpacing: 1.2,
    marginBottom: Spacing[2],
    marginTop: Spacing[2],
  },
  card: { paddingHorizontal: Spacing[3] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[2],
  },
  rowText: { flex: 1 },
});
