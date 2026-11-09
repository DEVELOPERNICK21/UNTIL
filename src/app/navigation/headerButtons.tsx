/**
 * Header buttons shared by the root navigator: the Home actions and the glass button style.
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileIcon, SettingsIcon, ShareIcon } from '../../assets/icons';
import type { useTheme } from '../../shared/theme';
import type { RootStackParamList } from '../../shared/navigation/types';

const HEADER_ICON_SIZE = 19;

export function getGlassIconButtonStyle(theme: ReturnType<typeof useTheme>) {
  return {
    backgroundColor: theme.glassBg,
    borderColor: theme.glassBorder,
  };
}

export function HomeHeaderActions({
  navigation,
  theme,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={headerButtonStyles.headerActions}>
      <TouchableOpacity
        onPress={() => navigation.navigate('ShareSnapshot')}
        style={[
          headerButtonStyles.headerIconButton,
          getGlassIconButtonStyle(theme),
        ]}
        activeOpacity={0.78}
      >
        <ShareIcon
          width={HEADER_ICON_SIZE}
          height={HEADER_ICON_SIZE}
          color={theme.textSecondary}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('Widget')}
        style={[
          headerButtonStyles.headerIconButton,
          headerButtonStyles.headerIconButtonSpacing,
          getGlassIconButtonStyle(theme),
        ]}
        activeOpacity={0.78}
      >
        <SettingsIcon
          width={HEADER_ICON_SIZE}
          height={HEADER_ICON_SIZE}
          color={theme.textSecondary}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('Settings')}
        style={[
          headerButtonStyles.headerIconButton,
          headerButtonStyles.headerIconButtonSpacing,
          getGlassIconButtonStyle(theme),
        ]}
        activeOpacity={0.78}
      >
        <ProfileIcon
          width={HEADER_ICON_SIZE}
          height={HEADER_ICON_SIZE}
          color={theme.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
}

export const headerButtonStyles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconButtonSpacing: {
    marginLeft: 8,
  },
});
