import React, { useEffect, useRef, memo, useMemo } from 'react';
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
 * ProgressLine - A horizontal progress bar with a dot at the end.
 * ⚡ OPTIMIZED: Uses React.memo and useNativeDriver: true for smooth, efficient animations
 * that run on the native UI thread, avoiding JS thread bottlenecks.
 */
export const ProgressLine = memo(({ progress, fillColor, style }: ProgressLineProps) => {
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
      useNativeDriver: true, // Offload to native thread
    }).start();
  }, [clampedProgress, animValue]);

  // Interpolate for translateX to move the fill bar and dot together
  // Mapping [0, 1] to [-lineWidth, 0] moves it from fully hidden to fully visible
  const translateX = useMemo(() => animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-lineWidth, 0],
  }), [animValue, lineWidth]);

  const color = fillColor ?? theme.progressFill;

  return (
    <View style={[styles.wrapper, { width: lineWidth }, style]}>
      <View style={[styles.track, { height: HEIGHT, backgroundColor: theme.progressTrack }]}>
        <Animated.View
          style={[
            styles.fillRow,
            {
              width: '100%',
              height: HEIGHT,
              transform: [{ translateX }],
            },
          ]}
        >
          <View style={[styles.fill, { flex: 1, height: HEIGHT, backgroundColor: color }]} />
          <View
            style={[
              styles.dot,
              {
                width: DOT_SIZE,
                height: DOT_SIZE,
                borderRadius: DOT_SIZE / 2,
                marginLeft: -DOT_SIZE / 2,
                backgroundColor: color,
              },
            ]}
          />
        </Animated.View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  track: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden', // Required for translateX clipping
  },
  fillRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fill: {
    borderRadius: 999,
  },
  dot: {},
});
