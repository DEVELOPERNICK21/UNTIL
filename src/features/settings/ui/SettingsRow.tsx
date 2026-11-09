/**
 * The two row shapes inside a Settings card: a tappable row with a chevron, and a row with a switch.
 */

import React from 'react';
import { View, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Text } from '../../../shared/ui';
import { useTheme, Spacing, Typography } from '../../../shared/theme';

const SWITCH_ON_TRACK = 'rgba(232, 124, 32, 0.45)';

interface SettingsRowProps {
  title: string;
  subtitle: string;
  onPress: () => void;
  /** The last row of a card has no divider under it. */
  last?: boolean;
  accessibilityLabel?: string;
}

export function SettingsRow({
  title,
  subtitle,
  onPress,
  last = false,
  accessibilityLabel,
}: SettingsRowProps) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      style={[
        settingsRowStyles.row,
        last
          ? settingsRowStyles.rowLast
          : { borderBottomColor: theme.glassBorder },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole={accessibilityLabel ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
    >
      <View style={settingsRowStyles.rowContent}>
        <Text variant="body" style={{ color: theme.textPrimary }}>
          {title}
        </Text>
        <Text
          variant="caption"
          style={[
            settingsRowStyles.rowSubtitle,
            { color: theme.textSecondary },
          ]}
        >
          {subtitle}
        </Text>
      </View>
      <Text style={[settingsRowStyles.chevron, { color: theme.textSecondary }]}>
        ›
      </Text>
    </TouchableOpacity>
  );
}

interface SettingsSwitchRowProps {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  last?: boolean;
  switchAccessibilityLabel?: string;
}

export function SettingsSwitchRow({
  title,
  subtitle,
  value,
  onValueChange,
  disabled,
  last = false,
  switchAccessibilityLabel,
}: SettingsSwitchRowProps) {
  const theme = useTheme();
  return (
    <View style={[settingsRowStyles.row, last && settingsRowStyles.rowLast]}>
      <View style={settingsRowStyles.rowContent}>
        <Text variant="body" style={{ color: theme.textPrimary }}>
          {title}
        </Text>
        <Text
          variant="caption"
          style={[
            settingsRowStyles.rowSubtitle,
            { color: theme.textSecondary },
          ]}
        >
          {subtitle}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        accessibilityLabel={switchAccessibilityLabel}
        trackColor={{ false: theme.divider, true: SWITCH_ON_TRACK }}
        thumbColor={value ? theme.percent : theme.textSecondary}
      />
    </View>
  );
}

export const settingsRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowContent: {
    flex: 1,
  },
  rowSubtitle: {
    marginTop: 2,
  },
  chevron: {
    fontSize: Typography.title,
    marginLeft: Spacing[2],
  },
});
