import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Easing,
} from 'react-native';
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
 * ProgressLine component optimized with React.memo and native driver animations.
 * Using translateX transforms instead of width avoids layout recalculations on every frame.
 */
function ProgressLineComponent({
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

  const fillTranslateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-lineWidth, 0],
  });

  const dotTranslateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-lineWidth / 2, lineWidth / 2],
  });

  const color = fillColor ?? theme.progressFill;

  return (
    <View
      style={[styles.wrapper, { width: lineWidth }, style]}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clampedProgress * 100) }}
    >
      <View
        style={[
          styles.track,
          { height: HEIGHT, backgroundColor: theme.progressTrack },
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
          styles.dotContainer,
          {
            transform: [{ translateX: dotTranslateX }],
          },
        ]}
      >
        <View
          style={[
            styles.dot,
            {
              width: DOT_SIZE,
              height: DOT_SIZE,
              borderRadius: DOT_SIZE / 2,
              backgroundColor: color,
            },
          ]}
        />
      </Animated.View>
    </View>
  );
}

export const ProgressLine = React.memo(ProgressLineComponent);

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: HEIGHT + 4, // Extra padding for the dot
  },
  track: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 999,
  },
  dotContainer: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {},
});
