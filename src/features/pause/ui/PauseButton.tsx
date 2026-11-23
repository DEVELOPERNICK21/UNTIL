import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '../../../shared/ui';
import { Radius, Spacing, useTheme } from '../../../shared/theme';

interface Props {
  label: string;
  onPress: () => void;
  /** `solid` is a choice or the next step. `quiet` is a way out, drawn without a box. */
  variant?: 'solid' | 'quiet';
  accessibilityHint?: string;
}

export function PauseButton({ label, onPress, variant = 'solid', accessibilityHint }: Props) {
  const theme = useTheme();
  const quiet = variant === 'quiet';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.button,
        !quiet && { backgroundColor: theme.glassBg, borderColor: theme.glassBorder },
        !quiet && styles.boxed,
        pressed && styles.pressed,
      ]}
    >
      <Text variant="body" color={quiet ? 'secondary' : 'primary'} style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  boxed: {
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    textAlign: 'center',
  },
});
