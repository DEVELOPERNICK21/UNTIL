import type { IPauseProgressRepository } from '../ports/IPauseProgressRepository';
import type { PauseProgress } from '../pauseProgress';

export class GetPauseProgressUseCase {
  constructor(private readonly repository: IPauseProgressRepository) {}

  execute(): PauseProgress {
    return this.repository.load();
  }
}
