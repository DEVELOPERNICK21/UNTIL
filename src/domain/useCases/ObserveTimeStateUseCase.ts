/**
 * ObserveTimeStateUseCase - Observes time state and user profile from TimeRepository
 */

import type { ITimeRepository } from '../repository/TimeRepository';
import type { TimeProgress } from '../../types';

export interface UserProfileState {
  birthDate: string | null;
  deathAge: number;
}

export interface TimeStateResult {
  userProfile: UserProfileState;
  timeState: TimeProgress;
}

export class ObserveTimeStateUseCase {
  constructor(private readonly repository: ITimeRepository) {}

  observe(): TimeStateResult {
    const userProfile = this.repository.getUserProfile();
    const timeState = this.repository.getTimeState();
    return { userProfile, timeState };
  }

  subscribe(callback: () => void): () => void {
    return this.repository.subscribe(callback);
  }
}
