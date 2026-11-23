/**
 * MMKV storage for Pause's calm minutes. One JSON value, read tolerantly: a missing, old or damaged
 * value is an empty start, never an error. Stored on this phone only, and never synced or sent.
 */

import type { IPauseProgressRepository } from '../domain/ports/IPauseProgressRepository';
import { EMPTY_PROGRESS, sanitizeProgress, type PauseProgress } from '../domain/pauseProgress';
import { STORAGE_KEYS } from '../../../shared/persistence/schema';
import { getString, setString } from '../../../shared/persistence/mmkv';

export class MmkvPauseProgressRepository implements IPauseProgressRepository {
  load(): PauseProgress {
    const raw = getString(STORAGE_KEYS.PAUSE_PROGRESS);
    if (!raw) return EMPTY_PROGRESS;
    try {
      return sanitizeProgress(JSON.parse(raw));
    } catch {
      return EMPTY_PROGRESS;
    }
  }

  save(progress: PauseProgress): void {
    setString(STORAGE_KEYS.PAUSE_PROGRESS, JSON.stringify(progress));
  }
}
