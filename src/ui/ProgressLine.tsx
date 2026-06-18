import React, { useEffect, useRef } from 'react';
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

export const ProgressLine = React.memo(function ProgressLine({
  progress,
  fillColor,
  style,
}: ProgressLineProps) {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const lineWidth = Math.min(windowWidth * 0.7, 280);
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

  const translateXFill = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-lineWidth, 0],
  });

  const translateXDot = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-DOT_SIZE / 2, lineWidth - DOT_SIZE / 2],
  });

  return (
    <View style={[styles.wrapper, { width: lineWidth }, style]}>
      <View
        style={[
          styles.track,
          {
            height: HEIGHT,
            backgroundColor: theme.progressTrack,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              width: lineWidth,
              height: HEIGHT,
              backgroundColor: color,
              transform: [{ translateX: translateXFill }],
            },
          ]}
        />
      </View>
      <Animated.View
        style={[
          styles.dot,
          {
            position: 'absolute',
            left: 0,
            top: (HEIGHT - DOT_SIZE) / 2,
            width: DOT_SIZE,
            height: DOT_SIZE,
            borderRadius: DOT_SIZE / 2,
            backgroundColor: color,
            transform: [{ translateX: translateXDot }],
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
  dot: {},
});