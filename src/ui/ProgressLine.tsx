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
 * ProgressLine - A high-performance progress bar component.
 * Optimized with React.memo and useNativeDriver: true for smooth animations.
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

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-lineWidth, 0],
  });

  const color = fillColor ?? theme.progressFill;

  return (
    <View style={[styles.wrapper, { width: lineWidth }, style]}>
      <View style={[styles.track, { height: HEIGHT, backgroundColor: theme.progressTrack }]}>
        <Animated.View
          style={[
            styles.fillRow,
            {
              width: lineWidth,
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
    overflow: 'hidden',
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
