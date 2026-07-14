import type { IPresenceRepository } from '../repository/IPresenceRepository';
import type { PresenceStreakState } from '../presence/presenceStreak';
import {
  EMPTY_PRESENCE,
  localDateKey,
  recordPresenceDay,
} from '../presence/presenceStreak';

export class RecordPresenceUseCase {
  constructor(private readonly presenceRepository: IPresenceRepository) {}

  execute(now: Date = new Date()): PresenceStreakState {
    const prev = this.presenceRepository.getState() ?? EMPTY_PRESENCE;
    const next = recordPresenceDay(prev, localDateKey(now));
    this.presenceRepository.setState(next);
    return next;
  }
}
