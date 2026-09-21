import React from 'react';
import { PeriodDotsGrid } from './PeriodDotsGrid';

export type LifeWeeksGridProps = {
  livedWeeks: number;
  renderWeeks: number;
  fillColor?: string;
};

/**
 * Renders a grid of life weeks.
 * Optimized with React.memo to prevent redundant component execution and re-renders
 * when parent screens (e.g. LifeScreen) re-render with unchanged props.
 */
function LifeWeeksGridInternal({
  livedWeeks,
  renderWeeks,
  fillColor,
}: LifeWeeksGridProps) {
  return (
    <PeriodDotsGrid
      filledCount={livedWeeks}
      totalCount={renderWeeks}
      fillColor={fillColor}
      accessibilityLabel={`${livedWeeks} of ${renderWeeks} weeks lived`}
    />
  );
}

export const LifeWeeksGrid = React.memo(LifeWeeksGridInternal);
