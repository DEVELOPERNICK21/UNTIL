import type { ActivityCategory } from '../../../shared/types';

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
