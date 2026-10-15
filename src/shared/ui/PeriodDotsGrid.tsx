import React, { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useTheme } from '../theme';
import {
  computeDotsGridLayout,
  DOT_RADIUS,
  dotCenter,
} from './periodDotsLayout';

export type PeriodDotsGridProps = {
  filledCount: number;
  totalCount: number;
  fillColor?: string;
  accessibilityLabel?: string;
};

/**
 * Renders filled/remaining dots on a single Skia canvas.
 * Life weeks (~4k) and year days (~365) must not mount one RN View per dot.
 */
function PeriodDotsGridComponent({
  filledCount,
  totalCount,
  fillColor,
  accessibilityLabel,
}: PeriodDotsGridProps) {
  const theme = useTheme();
  const filledFill = fillColor ?? theme.percent;
  const [width, setWidth] = useState(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const next = Math.floor(e.nativeEvent.layout.width);
    setWidth(prev => (prev === next ? prev : next));
  }, []);

  const safeTotal = Math.max(0, totalCount);
  const safeFilled = Math.max(0, Math.min(safeTotal, filledCount));
  const layout = useMemo(
    () => computeDotsGridLayout(safeTotal, width),
    [safeTotal, width],
  );

  const { filledPath, remainingPath } = useMemo(() => {
    if (layout.cols <= 0 || safeTotal === 0) {
      return { filledPath: null, remainingPath: null };
    }
    const filled = Skia.Path.Make();
    const remaining = Skia.Path.Make();
    for (let i = 0; i < safeTotal; i++) {
      const { x, y } = dotCenter(i, layout.cols);
      if (i < safeFilled) {
        filled.addCircle(x, y, DOT_RADIUS);
      } else {
        remaining.addCircle(x, y, DOT_RADIUS);
      }
    }
    return { filledPath: filled, remainingPath: remaining };
  }, [layout.cols, safeFilled, safeTotal]);

  const label =
    accessibilityLabel ?? `${safeFilled} of ${safeTotal} filled`;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      onLayout={onLayout}
      style={styles.grid}
    >
      {width > 0 && layout.height > 0 && filledPath && remainingPath ? (
        <Canvas style={{ width, height: layout.height }}>
          <Path path={filledPath} color={filledFill} style="fill" />
          <Path
            path={remainingPath}
            color={theme.progressTrack}
            style="fill"
          />
        </Canvas>
      ) : null}
    </View>
  );
}

export const PeriodDotsGrid = React.memo(PeriodDotsGridComponent);

const styles = StyleSheet.create({
  grid: {
    width: '100%',
  },
});
