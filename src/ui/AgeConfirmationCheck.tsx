import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Radius, Spacing, useTheme } from '../theme';
import { Text } from './Text';

interface AgeConfirmationCheckProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  minimumAge: number;
  disabled?: boolean;
}

export function AgeConfirmationCheck({
  checked,
  onChange,
  minimumAge,
  disabled = false,
}: AgeConfirmationCheckProps) {
  const theme = useTheme();
  const label = `I'm ${minimumAge} or older`;
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      disabled={disabled}
      style={styles.row}
      hitSlop={8}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
    >
      <View
        style={[
          styles.box,
          {
            borderColor: checked ? theme.percent : theme.divider,
            backgroundColor: checked ? theme.percent : 'transparent',
          },
        ]}
      >
        {checked ? <View style={styles.tick} /> : null}
      </View>
      <Text variant="body" color="secondary">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[1],
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#0E0E10',
  },
});
