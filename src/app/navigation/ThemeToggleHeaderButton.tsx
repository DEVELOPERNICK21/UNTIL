import React, { useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  TouchableOpacity,
  type GestureResponderEvent,
} from 'react-native';
import type { useTheme } from '../../shared/theme';
import { ThemeModeGlyph } from '../../shared/ui';
import { getGlassIconButtonStyle, headerButtonStyles } from './headerButtons';

const THEME_ICON_SIZE = 22;
/** How long the light/dark wipe takes. The navigator runs the same wipe over the whole screen. */
export const THEME_WIPE_DURATION_MS = 760;

export function ThemeToggleHeaderButton({
  resolvedTheme,
  theme,
  onToggle,
}: {
  resolvedTheme: 'light' | 'dark';
  theme: ReturnType<typeof useTheme>;
  onToggle: (origin: { x: number; y: number }) => void;
}) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const handlePress = (event: GestureResponderEvent) => {
    const { pageX, pageY } = event.nativeEvent;
    rotateAnim.setValue(0);
    pulseAnim.setValue(0);

    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.14,
          friction: 5,
          tension: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 180,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 140,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 260,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    onToggle({ x: pageX, y: pageY });
  };

  return (
    <TouchableOpacity
      style={[
        headerButtonStyles.headerIconButton,
        getGlassIconButtonStyle(theme),
        resolvedTheme === 'dark'
          ? styles.themeToggleDarkBg
          : styles.themeToggleLightBg,
      ]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.themePulseRing,
          resolvedTheme === 'dark'
            ? styles.themePulseRingDark
            : styles.themePulseRingLight,
          {
            opacity: pulseAnim,
            transform: [
              {
                scale: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.86, 1.24],
                }),
              },
            ],
          },
        ]}
      />

      <Animated.View
        style={{ transform: [{ rotate: rotation }, { scale: scaleAnim }] }}
      >
        <ThemeModeGlyph
          mode={resolvedTheme}
          size={THEME_ICON_SIZE}
          accent={theme.percent}
          moonColor={theme.textSecondary}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  themeToggleDarkBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.32)',
  },
  themeToggleLightBg: {
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
    borderColor: 'rgba(0, 0, 0, 0.26)',
  },
  themePulseRing: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1.2,
    borderRadius: 16,
  },
  themePulseRingDark: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  themePulseRingLight: {
    borderColor: 'rgba(0, 0, 0, 0.35)',
  },
});
