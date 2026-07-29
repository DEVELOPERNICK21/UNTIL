import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

export type LifeWeeksGridProps = {
  livedWeeks: number;
  renderWeeks: number;
  fillColor?: string;
};

function LifeWeeksGridComponent({
  livedWeeks,
  renderWeeks,
  fillColor,
}: LifeWeeksGridProps) {
  const theme = useTheme();
  const livedFill = fillColor ?? theme.percent;
  const livedDotStyle = useMemo(
    () => [styles.dot, { backgroundColor: livedFill }],
    [livedFill],
  );
  const remainingDotStyle = useMemo(
    () => [styles.dot, { backgroundColor: theme.progressTrack }],
    [theme.progressTrack],
  );
  const flags = useMemo(
    () =>
      Array.from({ length: Math.max(0, renderWeeks) }, (_, i) => i < livedWeeks),
    [renderWeeks, livedWeeks],
  );

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${livedWeeks} of ${renderWeeks} weeks lived`}
      style={styles.grid}
    >
      {flags.map((isLived, index) => (
        <View key={index} style={isLived ? livedDotStyle : remainingDotStyle} />
      ))}
    </View>
  );
}

export const LifeWeeksGrid = React.memo(LifeWeeksGridComponent);

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
});
