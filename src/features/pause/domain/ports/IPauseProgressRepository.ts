import type { PauseProgress } from '../pauseProgress';

export interface IPauseProgressRepository {
  load(): PauseProgress;
  save(progress: PauseProgress): void;
}
