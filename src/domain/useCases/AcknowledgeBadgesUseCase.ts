import type { IBadgeRepository } from '../repository/IBadgeRepository';

/** Records which celebrations the user has already watched. */
export class AcknowledgeBadgesUseCase {
  constructor(private readonly badgeRepository: IBadgeRepository) {}

  markSeen(ids: readonly string[]): void {
    if (ids.length === 0) return;
    const state = this.badgeRepository.getState();
    const seen = new Set(state.seen);
    ids.forEach(id => seen.add(id));
    this.badgeRepository.setState({ ...state, seen: [...seen] });
  }

  markStreakCelebrated(dateKey: string): void {
    const state = this.badgeRepository.getState();
    if (state.streakCelebratedOn === dateKey) return;
    this.badgeRepository.setState({ ...state, streakCelebratedOn: dateKey });
  }

  getStreakCelebratedOn(): string | null {
    return this.badgeRepository.getState().streakCelebratedOn;
  }
}
