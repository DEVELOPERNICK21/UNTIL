import type { IPresenceRepository } from '../ports/IPresenceRepository';
import type { PresenceStreakState } from '../presenceStreak';
import {
  EMPTY_PRESENCE,
  localDateKey,
  recordPresenceDay,
} from '../presenceStreak';

export class RecordPresenceUseCase {
  constructor(private readonly presenceRepository: IPresenceRepository) {}

  execute(now: Date = new Date()): PresenceStreakState {
    const prev = this.presenceRepository.getState() ?? EMPTY_PRESENCE;
    const next = recordPresenceDay(prev, localDateKey(now));
    this.presenceRepository.setState(next);
    return next;
  }
}
