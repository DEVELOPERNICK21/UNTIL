import type { PresenceStreakState } from '../presenceStreak';

export type { PresenceStreakState };

export interface IPresenceRepository {
  getState(): PresenceStreakState;
  setState(state: PresenceStreakState): void;
}
