/**
 * "Continue with Google" button. Light fill on both themes, per Google's branding rules, with the
 * same height and radius as the Apple button.
 */

import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Text } from '../../../shared/ui';
import {
  Radius,
  Spacing,
  Weight,
  getFontFamilyForWeight,
  useTheme,
} from '../../../shared/theme';
import { GoogleMark } from './GoogleMark';

type Props = {
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function GoogleSignInButton({
  onPress,
  busy = false,
  disabled,
  style,
}: Props) {
  const theme = useTheme();
  const isLight = theme.statusBarStyle === 'dark-content';
  const isDisabled = disabled ?? busy;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: isLight ? '#FFFFFF' : '#F8F8F8',
          borderColor: isLight ? 'rgba(26,26,26,0.12)' : 'transparent',
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      accessibilityState={{ busy, disabled: isDisabled }}
    >
      {busy ? (
        <ActivityIndicator color="#1A1A1A" />
      ) : (
        <>
          <GoogleMark />
          <Text variant="sectionTitle" style={styles.label}>
            Continue with Google
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    minHeight: 52,
    gap: Spacing[2],
  },
  label: {
    fontFamily: getFontFamilyForWeight(Weight.semibold),
    color: '#1A1A1A',
  },
});
