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

export const ProgressLine = memo(function ProgressLine({
  progress,
  fillColor,
  style,
}: ProgressLineProps) {
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

  // translateX for the fill maps [0, 1] to [-lineWidth, 0]
  // This avoids layout changes by translating a full-width fill.
  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-lineWidth, 0],
  });

  // translateX for the dot maps [0, 1] to [-lineWidth / 2, lineWidth / 2]
  // since the dot is absolutely positioned in the center of the track.
  const dotTranslateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-lineWidth / 2, lineWidth / 2],
  });

  const color = fillColor ?? theme.progressFill;

  return (
    <View
      style={[
        styles.wrapper,
        { width: lineWidth + DOT_SIZE, height: Math.max(HEIGHT, DOT_SIZE) },
        style,
      ]}
    >
      <View
        style={[
          styles.track,
          {
            width: lineWidth,
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
              transform: [{ translateX }],
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 999,
  },
  dot: {
    position: 'absolute',
  },
});
