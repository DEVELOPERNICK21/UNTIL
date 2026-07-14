import type { PresenceStreakState } from '../presence/presenceStreak';

export type { PresenceStreakState };

export interface IPresenceRepository {
  getState(): PresenceStreakState;
  setState(state: PresenceStreakState): void;
}
