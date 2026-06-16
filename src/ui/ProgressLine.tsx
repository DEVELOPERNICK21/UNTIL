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

export const ProgressLine = memo(function ProgressLineComponent({ progress, fillColor, style }: ProgressLineProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const lineWidth = Math.min(width * 0.7, 280);
  const clampedProgress = Math.min(1, Math.max(0, progress));

  // Use a ref for the animated value to ensure it persists across re-renders
  const animValue = useRef(new Animated.Value(clampedProgress)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: clampedProgress,
      duration: ANIM_DURATION,
      easing: EASE,
      useNativeDriver: true, // Optimized: Using native driver for better performance
    }).start();
  }, [clampedProgress, animValue]);

  // Interpolate translateX for the fill and dot
  const fillTranslateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-lineWidth, 0],
  });

  const dotTranslateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-DOT_SIZE / 2, lineWidth - DOT_SIZE / 2],
  });

  const color = fillColor ?? theme.progressFill;

  return (
    <View style={[styles.wrapper, { width: lineWidth }, style]}>
      {/* Track with overflow hidden to clip the fill animation */}
      <View style={[styles.track, { height: HEIGHT, backgroundColor: theme.progressTrack }]}>
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

      {/* Dot is positioned absolutely outside the track to avoid clipping */}
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: color,
            top: (HEIGHT - DOT_SIZE) / 2,
            transform: [{ translateX: dotTranslateX }],
          },
        ]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 999,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    position: 'absolute',
    left: 0,
    // Ensuring the dot stays on top of the track
    zIndex: 1,
  },
});
