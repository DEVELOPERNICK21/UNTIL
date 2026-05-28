/**
 * LogActivityUseCase - Start or end activity tracking
 */

import type { IActivityRepository } from '../repository/IActivityRepository';
import type { IClock } from '../ports/IClock';
import type { ActivityCategory } from '../../types';

export class LogActivityUseCase {
  constructor(
    private readonly repository: IActivityRepository,
    private readonly clock: IClock
  ) {}

  startCategory(category: ActivityCategory): void {
    const now = this.clock.nowMs();
    const dateIso = this.clock.todayIso();
    const blocks = this.repository.getBlocksForDate(dateIso);

    const withEndedOngoing = blocks.map((b) =>
      b.endMs === undefined ? { ...b, endMs: now } : b
    );
    const newBlock = { startMs: now, category };
    this.repository.saveBlocksForDate(dateIso, [...withEndedOngoing, newBlock]);
  }

  endCurrentBlock(): void {
    const now = this.clock.nowMs();
    const dateIso = this.clock.todayIso();
    const blocks = this.repository.getBlocksForDate(dateIso);

    const updated = blocks.map((b) =>
      b.endMs === undefined ? { ...b, endMs: now } : b
    );
    this.repository.saveBlocksForDate(dateIso, updated);
  }
}
