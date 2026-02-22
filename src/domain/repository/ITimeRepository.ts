/**
 * ITimeRepository - Port for time and user profile data
 * SSOT: all reads/writes for user/time go through this interface.
 */

import type { TimeProgress, WidgetCache } from '../../types';

type Subscriber = () => void;

export interface ITimeRepository {
  getUserProfile(): { birthDate: string | null; deathAge: number };
  getTimeState(): TimeProgress;
  /** Widget cache derived from same time logic as getTimeState (SSOT). */
  getWidgetCache(): WidgetCache;
  setUserProfile(birthDate: string, deathAge: number): void;
  subscribe(callback: Subscriber): () => void;
}
