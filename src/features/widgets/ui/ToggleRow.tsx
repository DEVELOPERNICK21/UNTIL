import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../../../shared/ui';
import { Spacing, useTheme } from '../../../shared/theme';
import type { ThemePalette } from '../../../shared/theme';

interface ToggleRowProps {
  label: string;
  active: boolean;
  onToggle: () => void;
}

export function ToggleRow({ label, active, onToggle }: ToggleRowProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.toggleRow}
      onPress={onToggle}
    >
      <Text variant="body" style={styles.toggleLabel}>
        {label}
      </Text>
      <View
        style={[
          styles.toggleTrack,
          active ? styles.toggleTrackOn : styles.toggleTrackOff,
        ]}
      >
        <View
          style={[
            styles.toggleThumb,
            active ? styles.toggleThumbOn : styles.toggleThumbOff,
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

function createStyles(theme: ThemePalette) {
  return StyleSheet.create({
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: Spacing.sm,
    },
    toggleLabel: {
      color: theme.textPrimary,
    },
    toggleTrack: {
      width: 44,
      height: 26,
      borderRadius: 13,
      padding: 3,
      flexDirection: 'row',
      alignItems: 'center',
    },
    toggleTrackOn: {
      backgroundColor: theme.percent,
      justifyContent: 'flex-end',
    },
    toggleTrackOff: {
      backgroundColor: theme.divider,
      justifyContent: 'flex-start',
    },
    toggleThumb: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.cardBase,
    },
    toggleThumbOn: {},
    toggleThumbOff: {},
  });
}
