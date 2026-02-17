import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0-1
  height?: number;
  color?: string;
  backgroundColor?: string;
  showThumb?: boolean;
}

const THUMB_SIZE = 12;

export function ProgressBar({
  progress,
  height = 8,
  color = '#6B7280',
  backgroundColor = '#374151',
  showThumb = false,
}: ProgressBarProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return (
    <View style={[styles.track, { height, backgroundColor }, showThumb && styles.trackVisible]}>
      <View
        style={[
          styles.fillRow,
          {
            width: `${clampedProgress * 100}%`,
            height,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              flex: 1,
              height,
              backgroundColor: color,
            },
          ]}
        />
        {showThumb ? (
          <View
            style={[
              styles.thumb,
              {
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                borderRadius: THUMB_SIZE / 2,
                marginLeft: -THUMB_SIZE / 2,
              },
            ]}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  trackVisible: {
    overflow: 'visible',
  },
  fillRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fill: {
    borderRadius: 999,
  },
  thumb: {
    backgroundColor: '#FFFFFF',
  },
});
