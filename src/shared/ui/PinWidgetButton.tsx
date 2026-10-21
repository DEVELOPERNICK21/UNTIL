import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Spacing, Radius, useTheme } from '../theme';
import { Text } from './Text';

interface PinWidgetButtonProps {
  label: string;
  onPress: () => void;
  busy?: boolean;
  /** `primary` is a filled button; `link` is a quiet text button for a secondary offer. */
  variant?: 'primary' | 'link';
  style?: StyleProp<ViewStyle>;
}

/** "Add to home screen" button. The caller decides whether to show it (see usePinWidget). */
export function PinWidgetButton({
  label,
  onPress,
  busy = false,
  variant = 'primary',
  style,
}: PinWidgetButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={busy}
      activeOpacity={0.85}
      hitSlop={isPrimary ? undefined : { top: 8, bottom: 8, left: 8, right: 8 }}
      style={[
        isPrimary ? styles.primary : styles.link,
        isPrimary && { backgroundColor: theme.percent },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy, disabled: busy }}
    >
      {busy ? (
        <ActivityIndicator
          color={isPrimary ? '#FFFFFF' : theme.textSecondary}
        />
      ) : (
        <Text
          variant={isPrimary ? 'sectionTitle' : 'body'}
          style={{ color: isPrimary ? '#FFFFFF' : theme.percent }}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primary: {
    minHeight: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[4],
  },
  link: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[3],
  },
});
