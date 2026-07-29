import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

export type LifeWeeksGridProps = {
  livedWeeks: number;
  renderWeeks: number;
  fillColor?: string;
};

export function LifeWeeksGrid({
  livedWeeks,
  renderWeeks,
  fillColor,
}: LifeWeeksGridProps) {
  const theme = useTheme();
  const livedFill = fillColor ?? theme.percent;
  const flags = useMemo(
    () =>
      Array.from({ length: Math.max(0, renderWeeks) }, (_, i) => i < livedWeeks),
    [renderWeeks, livedWeeks],
  );

  return (
    <View style={styles.grid} accessibilityLabel={`${livedWeeks} of ${renderWeeks} weeks lived`}>
      {flags.map((isLived, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            isLived ? { backgroundColor: livedFill } : styles.dotRemaining,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
    marginVertical: 3,
  },
  dotRemaining: {
    backgroundColor: '#4A4A4A',
  },
});
