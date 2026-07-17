/**
 * LogActivityUseCase - Start or end activity tracking
 */

import type { IActivityRepository } from '../repository/IActivityRepository';
import type { IClock } from '../ports/IClock';
import type { ActivityCategory } from '../../types';
import { remainingNothingLoggableHours } from '../../core/activity/aggregate';

const MS_PER_HOUR = 60 * 60 * 1000;

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

  /** Add a completed block ending now (for quick manual logging). */
  addPastBlock(category: ActivityCategory, durationMinutes: number): void {
    const now = this.clock.nowMs();
    const dateIso = this.clock.todayIso();
    const blocks = this.repository.getBlocksForDate(dateIso);

    const withEndedOngoing = blocks.map((b) =>
      b.endMs === undefined ? { ...b, endMs: now } : b
    );

    const remainingHours = remainingNothingLoggableHours(
      category === 'nothing' ? withEndedOngoing : blocks,
      now
    );
    const requestedHours = Math.max(1, Math.min(24 * 60, durationMinutes)) / 60;
    const addHours =
      category === 'nothing'
        ? Math.min(requestedHours, remainingHours)
        : requestedHours;

    if (addHours <= 0) {
      return;
    }

    const addMs = addHours * MS_PER_HOUR;
    const newBlock = { startMs: now - addMs, endMs: now, category };
    this.repository.saveBlocksForDate(dateIso, [
      ...withEndedOngoing,
      newBlock,
    ]);
  }
}
