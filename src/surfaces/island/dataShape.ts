import type { ActivityCategory } from '../../types';

/**
 * Live Activity / Dynamic Island data shapes
 * Mirrors Swift ActivityAttributes ContentState
 */

export interface LiveActivityState {
  dayProgress: number;
  monthProgress: number;
  yearProgress: number;
  lifeProgress: number;
  wastedMinutesToday?: number;
  primaryWastedCategory?: ActivityCategory | null;
}
