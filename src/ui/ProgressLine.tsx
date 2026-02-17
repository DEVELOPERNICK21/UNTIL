import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Colors } from '../theme';

interface ProgressLineProps {
  progress: number;
  style?: object;
}

const HEIGHT = 2;
const DOT_SIZE = 6;

export function ProgressLine({ progress, style }: ProgressLineProps) {
  const { width } = useWindowDimensions();
  const lineWidth = width * 0.7;
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return (
    <View style={[styles.wrapper, { width: lineWidth }, style]}>
      <View style={[styles.track, { height: HEIGHT }]}>
        <View
          style={[
            styles.fillRow,
            {
              width: `${clampedProgress * 100}%`,
              height: HEIGHT,
            },
          ]}
        >
          <View
            style={[
              styles.fill,
              {
                flex: 1,
                height: HEIGHT,
              },
            ]}
          />
          <View
            style={[
              styles.dot,
              {
                width: DOT_SIZE,
                height: DOT_SIZE,
                borderRadius: DOT_SIZE / 2,
                marginLeft: -DOT_SIZE / 2,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  track: {
    width: '100%',
    backgroundColor: Colors.divider,
    borderRadius: 999,
    overflow: 'visible',
  },
  fillRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fill: {
    backgroundColor: Colors.divider,
    borderRadius: 999,
  },
  dot: {
    backgroundColor: Colors.primaryText,
  },
});
