import React from 'react';
import { PeriodDotsGrid } from './PeriodDotsGrid';

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
  return (
    <PeriodDotsGrid
      filledCount={livedWeeks}
      totalCount={renderWeeks}
      fillColor={fillColor}
      accessibilityLabel={`${livedWeeks} of ${renderWeeks} weeks lived`}
    />
  );
}
