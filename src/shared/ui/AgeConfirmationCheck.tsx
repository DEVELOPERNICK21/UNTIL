import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Radius, Spacing, useTheme } from '../theme';
import { Text } from './Text';
import { useTranslation } from '../i18n/useTranslation';

interface AgeConfirmationCheckProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  minimumAge: number;
  disabled?: boolean;
  /** Highlights the box when the user tried to continue without ticking it. */
  attention?: boolean;
}

export function AgeConfirmationCheck({
  checked,
  onChange,
  minimumAge,
  disabled = false,
  attention = false,
}: AgeConfirmationCheckProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const label = t('common.age.label', { age: minimumAge });
  const needsTick = attention && !checked;
  const borderColor = checked || attention ? theme.percent : theme.textMuted;
  return (
    <View>
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
              borderColor,
              borderWidth: needsTick ? 2 : 1.5,
              backgroundColor: checked ? theme.percent : 'transparent',
            },
          ]}
        >
          {checked ? (
            <Svg width={14} height={14} viewBox="0 0 24 24">
              <Path
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke="#FFFFFF"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          ) : null}
        </View>
        <Text variant="body" color={needsTick ? 'primary' : 'secondary'}>
          {label}
        </Text>
      </Pressable>
      {needsTick ? (
        <Text variant="caption" style={[styles.hint, { color: theme.percent }]}>
          {t('common.age.hint')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[1],
  },
  hint: {
    marginLeft: 22 + Spacing[2],
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
