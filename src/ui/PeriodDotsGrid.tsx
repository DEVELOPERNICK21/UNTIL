import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

export type PeriodDotsGridProps = {
  filledCount: number;
  totalCount: number;
  fillColor?: string;
  accessibilityLabel?: string;
};

function PeriodDotsGridComponent({
  filledCount,
  totalCount,
  fillColor,
  accessibilityLabel,
}: PeriodDotsGridProps) {
  const theme = useTheme();
  const filledFill = fillColor ?? theme.percent;
  const filledStyle = useMemo(
    () => [styles.dot, { backgroundColor: filledFill }],
    [filledFill],
  );
  const remainingStyle = useMemo(
    () => [styles.dot, { backgroundColor: theme.progressTrack }],
    [theme.progressTrack],
  );
  const safeTotal = Math.max(0, totalCount);
  const safeFilled = Math.max(0, Math.min(safeTotal, filledCount));
  const flags = useMemo(
    () => Array.from({ length: safeTotal }, (_, i) => i < safeFilled),
    [safeTotal, safeFilled],
  );
  const label =
    accessibilityLabel ?? `${safeFilled} of ${safeTotal} filled`;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={styles.grid}
    >
      {flags.map((isFilled, index) => (
        <View key={index} style={isFilled ? filledStyle : remainingStyle} />
      ))}
    </View>
  );
}

export const PeriodDotsGrid = React.memo(PeriodDotsGridComponent);

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
