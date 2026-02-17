import React from 'react';
import { View, StyleSheet } from 'react-native';

interface DotsGridProps {
  rows?: number;
  cols?: number;
  fillCount?: number; // Number of filled dots (0 to rows*cols)
  fillColor?: string;
  emptyColor?: string;
  size?: number;
  gap?: number;
}

export function DotsGrid({
  rows = 10,
  cols = 10,
  fillCount = 0,
  fillColor = '#2563EB',
  emptyColor = '#E5E7EB',
  size = 4,
  gap = 2,
}: DotsGridProps) {
  const total = rows * cols;
  const filled = Math.min(total, Math.max(0, fillCount));

  return (
    <View style={[styles.grid, { gap }]}>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <View key={rowIndex} style={[styles.row, { gap }]}>
          {Array.from({ length: cols }, (_, colIndex) => {
            const index = rowIndex * cols + colIndex;
            const isFilled = index < filled;
            return (
              <View
                key={colIndex}
                style={[
                  styles.dot,
                  {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: isFilled ? fillColor : emptyColor,
                  },
                ]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {},
  row: { flexDirection: 'row' },
  dot: {},
});
