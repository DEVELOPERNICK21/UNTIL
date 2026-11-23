import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Radius, Spacing } from '../../../shared/theme';
import { CalmText } from './CalmText';
import { CALM } from './calmPalette';

interface Props {
  label: string;
  onPress: () => void;
  /** `solid` is the next step, `soft` is a choice, `quiet` is a way out. */
  variant?: 'solid' | 'soft' | 'quiet';
  accessibilityHint?: string;
}

export function CalmButton({ label, onPress, variant = 'soft', accessibilityHint }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.button,
        variant === 'solid' && styles.solid,
        variant === 'soft' && styles.soft,
        pressed && styles.pressed,
      ]}
    >
      <CalmText
        variant="body"
        tone={variant === 'solid' ? 'primary' : variant === 'quiet' ? 'secondary' : 'primary'}
        style={[styles.label, variant === 'solid' && styles.solidLabel]}
      >
        {label}
      </CalmText>
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
  soft: {
    backgroundColor: CALM.card,
    borderWidth: 1,
    borderColor: CALM.cardBorder,
  },
  solid: {
    backgroundColor: CALM.accent,
  },
  solidLabel: {
    color: CALM.bgTop,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    textAlign: 'center',
  },
});
