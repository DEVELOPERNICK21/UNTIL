/**
 * LogActivityUseCase - Start or end activity tracking
 */

import type { IActivityRepository } from '../repository/IActivityRepository';
import type { ActivityCategory } from '../../types';
import { nowMs, formatDateToIso } from '../../core/time/clock';

export class LogActivityUseCase {
  constructor(private readonly repository: IActivityRepository) {}

  startCategory(category: ActivityCategory): void {
    const now = nowMs();
    const dateIso = formatDateToIso(new Date());
    const blocks = this.repository.getBlocksForDate(dateIso);

    const withEndedOngoing = blocks.map((b) =>
      b.endMs === undefined ? { ...b, endMs: now } : b
    );
    const newBlock = { startMs: now, category };
    this.repository.saveBlocksForDate(dateIso, [...withEndedOngoing, newBlock]);
  }

  endCurrentBlock(): void {
    const now = nowMs();
    const dateIso = formatDateToIso(new Date());
    const blocks = this.repository.getBlocksForDate(dateIso);

    const updated = blocks.map((b) =>
      b.endMs === undefined ? { ...b, endMs: now } : b
    );
    this.repository.saveBlocksForDate(dateIso, updated);
  }
}
