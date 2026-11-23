import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, useWindowDimensions } from 'react-native';
import { getPaletteForMode } from '../../shared/theme';
import { useThemeStore } from '../../shared/theme/themeStore';
import { THEME_WIPE_DURATION_MS } from './ThemeToggleHeaderButton';

/**
 * The light/dark wipe: a circle that grows from the toggle button over the whole screen, hiding the flip of
 * the theme underneath. The navigator draws the circle; this holds its state and starts the wipe.
 */
export function useThemeTransition() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const resolvedTheme = useThemeStore(s => s.resolvedTheme);
  const setThemeMode = useThemeStore(s => s.setThemeMode);
  const [themeTransition, setThemeTransition] = useState<{
    x: number;
    y: number;
    color: string;
    visible: boolean;
  } | null>(null);
  const themeWipeAnim = useRef(new Animated.Value(0)).current;
  const themeApplyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxRadius = Math.sqrt(
    screenWidth * screenWidth + screenHeight * screenHeight,
  );
  const circleDiameter = maxRadius * 2;

  useEffect(() => {
    return () => {
      if (themeApplyTimerRef.current) {
        clearTimeout(themeApplyTimerRef.current);
      }
    };
  }, []);

  const themeTransitionCircleStyle = themeTransition
    ? {
        width: circleDiameter,
        height: circleDiameter,
        borderRadius: circleDiameter / 2,
        left: themeTransition.x - circleDiameter / 2,
        top: themeTransition.y - circleDiameter / 2,
        backgroundColor: themeTransition.color,
        opacity: themeWipeAnim.interpolate({
          // Higher mid opacity masks the store flip for a smoother transition.
          inputRange: [0, 0.2, 0.55, 1],
          outputRange: [0, 0.58, 0.5, 0],
        }),
        transform: [
          {
            scale: themeWipeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.02, 1],
            }),
          },
        ],
      }
    : null;

  const startThemeTransitionFrom = (origin: { x: number; y: number }) => {
    const nextMode = resolvedTheme === 'dark' ? 'light' : 'dark';
    const nextThemeColor = getPaletteForMode(nextMode).background;

    if (themeApplyTimerRef.current) {
      clearTimeout(themeApplyTimerRef.current);
    }

    setThemeTransition({
      x: origin.x,
      y: origin.y,
      color: nextThemeColor,
      visible: true,
    });

    themeWipeAnim.setValue(0);
    Animated.timing(themeWipeAnim, {
      toValue: 1,
      duration: THEME_WIPE_DURATION_MS,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start(() => {
      setThemeTransition(prev => (prev ? { ...prev, visible: false } : prev));
      themeWipeAnim.setValue(0);
    });

    // Apply while overlay is dense, so UI token changes are hidden smoothly.
    themeApplyTimerRef.current = setTimeout(() => {
      setThemeMode(nextMode).catch(() => {
        // Ignore persistence errors; in-memory theme still updates.
      });
    }, Math.round(THEME_WIPE_DURATION_MS * 0.18));
  };

  return { resolvedTheme, themeTransition, themeTransitionCircleStyle, startThemeTransitionFrom };
}
