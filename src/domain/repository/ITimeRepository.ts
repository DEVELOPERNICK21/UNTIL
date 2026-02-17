/**
 * ITimeRepository - Port for time and user profile data
 * Single Source of Truth: all reads/writes for user/time go through this interface.
 */

import type { TimeProgress } from '../../types';

type Subscriber = () => void;

export interface ITimeRepository {
  getUserProfile(): { birthDate: string | null; deathAge: number };
  getTimeState(): TimeProgress;
  setUserProfile(birthDate: string, deathAge: number): void;
  subscribe(callback: Subscriber): () => void;
}
