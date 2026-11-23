import type { IPauseProgressRepository } from '../ports/IPauseProgressRepository';
import { buildPauseGlance, type PauseGlance } from '../pauseGlance';

/** Pause at a glance, for the home-screen widgets and the Dynamic Island. */
export class GetPauseGlanceUseCase {
  constructor(private readonly repository: IPauseProgressRepository) {}

  execute(today: string): PauseGlance {
    return buildPauseGlance(this.repository.load(), today);
  }
}
