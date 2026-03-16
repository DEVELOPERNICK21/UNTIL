/**
 * Horizontal slider — theme track and thumb; used for lifespan etc.
 * Uses theme.percent for fill and thumb; respects min/max and step.
 */

import React, { useRef, useCallback, useState } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import { useTheme, Spacing } from '../theme';

const TRACK_HEIGHT = 4;
const THUMB_SIZE = 24;

export interface SliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  onValueChange: (value: number) => void;
  step?: number;
}

export function Slider({
  value,
  minimumValue,
  maximumValue,
  onValueChange,
  step = 1,
}: SliderProps) {
  const theme = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);

  const clamp = useCallback(
    (v: number) => {
      let n = Math.max(minimumValue, Math.min(maximumValue, v));
      if (step > 0) n = Math.round(n / step) * step;
      return n;
    },
    [minimumValue, maximumValue, step]
  );

  const startValueRef = useRef(value);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, g) => {
        const w = trackWidthRef.current;
        if (w <= 0) return;
        const progress = Math.max(0, Math.min(1, g.x0 / w));
        startValueRef.current = minimumValue + progress * (maximumValue - minimumValue);
        onValueChange(clamp(startValueRef.current));
      },
      onPanResponderMove: (_, g) => {
        const w = trackWidthRef.current;
        if (w <= 0) return;
        const deltaProgress = g.dx / w;
        const range = maximumValue - minimumValue;
        const newVal = startValueRef.current + deltaProgress * range;
        onValueChange(clamp(newVal));
      },
    })
  ).current;

  const range = maximumValue - minimumValue;
  const progress = range <= 0 ? 0 : (value - minimumValue) / range;
  const fillWidth = `${progress * 100}%`;
  const thumbLeft =
    trackWidth > 0
      ? Math.max(0, Math.min(trackWidth - THUMB_SIZE, progress * trackWidth - THUMB_SIZE / 2))
      : 0;

  const handleLayout = useCallback((e: { nativeEvent: { layout: { width: number } } }) => {
    const w = e.nativeEvent.layout.width;
    trackWidthRef.current = w;
    setTrackWidth(w);
  }, []);

  return (
    <View style={styles.wrap} onLayout={handleLayout} {...panResponder.panHandlers}>
      <View style={[styles.track, { backgroundColor: theme.progressTrack }]}>
        <View
          style={[
            styles.fill,
            {
              width: fillWidth,
              backgroundColor: theme.percent,
            },
          ]}
        />
        <View
          style={[
            styles.thumb,
            {
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              backgroundColor: theme.percent,
              left: thumbLeft,
            },
          ]}
        >
          <View style={[styles.thumbDot, { backgroundColor: theme.background }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: THUMB_SIZE + Spacing[2],
    justifyContent: 'center',
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'visible',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    position: 'absolute',
    top: (TRACK_HEIGHT - THUMB_SIZE) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
