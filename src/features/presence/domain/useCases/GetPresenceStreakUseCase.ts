import type { IPresenceRepository } from '../ports/IPresenceRepository';
import type { PresenceStreakState } from '../presenceStreak';
import { EMPTY_PRESENCE, localDateKey } from '../presenceStreak';
import { now as clockNow } from '../../../../shared/time/clock';

export class GetPresenceStreakUseCase {
  constructor(private readonly presenceRepository: IPresenceRepository) {}

  execute(now: Date = clockNow()): PresenceStreakState {
    const state = this.presenceRepository.getState() ?? EMPTY_PRESENCE;
    const today = localDateKey(now);
    return {
      ...state,
      // >= covers a local date that moved backwards (time zone change).
      noticedToday: state.lastDateKey != null && state.lastDateKey >= today,
    };
  }
}
