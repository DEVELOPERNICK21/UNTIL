import React, { useEffect, useRef, memo } from 'react';
import { View, StyleSheet, useWindowDimensions, Animated, Easing } from 'react-native';
import { useTheme } from '../theme';

interface ProgressLineProps {
  progress: number;
  fillColor?: string;
  style?: object;
}

const HEIGHT = 10;
const DOT_SIZE = 6;
const ANIM_DURATION = 380;
const EASE = Easing.out(Easing.cubic);

/**
 * ProgressLine component with native driver animations for better performance.
 * Memoized to prevent unnecessary re-renders.
 */
export const ProgressLine = memo(function ProgressLine({ progress, fillColor, style }: ProgressLineProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const lineWidth = Math.min(width * 0.7, 280);
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const animValue = useRef(new Animated.Value(clampedProgress)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: clampedProgress,
      duration: ANIM_DURATION,
      easing: EASE,
      useNativeDriver: true,
    }).start();
  }, [clampedProgress, animValue]);

  const color = fillColor ?? theme.progressFill;

  // Animate fill using translateX for native driver support
  const fillTranslateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-lineWidth, 0],
  });

  // Animate dot using translateX for native driver support
  const dotTranslateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, lineWidth],
  });

  return (
    <View style={[styles.wrapper, { width: lineWidth }, style]}>
      <View
        style={[
          styles.track,
          { height: HEIGHT, backgroundColor: theme.progressTrack, overflow: 'hidden' },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              width: lineWidth,
              height: HEIGHT,
              backgroundColor: color,
              transform: [{ translateX: fillTranslateX }],
            },
          ]}
        />
      </View>
      <Animated.View
        style={[
          styles.dot,
          {
            width: DOT_SIZE,
            height: DOT_SIZE,
            borderRadius: DOT_SIZE / 2,
            backgroundColor: color,
            transform: [{ translateX: dotTranslateX }],
          },
        ]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    // Allow dot to be visible even when at the very beginning or end
    overflow: 'visible',
  },
  track: {
    width: '100%',
    borderRadius: 999,
  },
  fill: {
    borderRadius: 999,
  },
  dot: {
    position: 'absolute',
    left: -DOT_SIZE / 2,
    top: (HEIGHT - DOT_SIZE) / 2,
  },
});
