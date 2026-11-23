import type { IPauseProgressRepository } from '../ports/IPauseProgressRepository';
import {
  goalReached,
  levelFor,
  newMilestones,
  recordSession,
  secondsToday,
  type MilestoneId,
  type PauseProgress,
  type SessionRecord,
} from '../pauseProgress';

export interface RecordedSession {
  progress: PauseProgress;
  /** Seconds that counted (0 when the session was too short to count). */
  gainedSeconds: number;
  milestones: MilestoneId[];
  leveledUp: boolean;
  /** Today's goal was reached by this session, not before it. */
  goalReachedNow: boolean;
}

/** Adds one finished practice to the person's calm minutes, and says what that unlocked. */
export class RecordPauseSessionUseCase {
  constructor(private readonly repository: IPauseProgressRepository) {}

  execute(session: SessionRecord): RecordedSession {
    const before = this.repository.load();
    const after = recordSession(before, session);
    if (after === before) {
      return { progress: before, gainedSeconds: 0, milestones: [], leveledUp: false, goalReachedNow: false };
    }
    this.repository.save(after);
    return {
      progress: after,
      gainedSeconds: after.totalSeconds - before.totalSeconds,
      milestones: newMilestones(before, after),
      leveledUp: levelFor(after.totalSeconds).index > levelFor(before.totalSeconds).index,
      goalReachedNow: !goalReached(secondsToday(before, session.date)) && goalReached(secondsToday(after, session.date)),
    };
  }
}
