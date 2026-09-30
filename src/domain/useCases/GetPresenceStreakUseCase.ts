import type { IPresenceRepository } from '../repository/IPresenceRepository';
import type { PresenceStreakState } from '../presence/presenceStreak';
import { EMPTY_PRESENCE, localDateKey } from '../presence/presenceStreak';

export class GetPresenceStreakUseCase {
  constructor(private readonly presenceRepository: IPresenceRepository) {}

  execute(now: Date = new Date()): PresenceStreakState {
    const state = this.presenceRepository.getState() ?? EMPTY_PRESENCE;
    const today = localDateKey(now);
    return {
      ...state,
      // >= covers a local date that moved backwards (time zone change).
      noticedToday: state.lastDateKey != null && state.lastDateKey >= today,
    };
  }
}
