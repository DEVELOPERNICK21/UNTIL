/**
 * IBadgeRepository - Port for earned badges and what the user has been shown.
 */

export interface BadgeState {
  /** Badge id -> local date (YYYY-MM-DD) it was earned. Never removed. */
  earned: Record<string, string>;
  /** Badge ids whose unlock celebration has already played. */
  seen: string[];
  /** Local date the streak celebration last played, so it runs once a day. */
  streakCelebratedOn: string | null;
}

export const EMPTY_BADGE_STATE: BadgeState = {
  earned: {},
  seen: [],
  streakCelebratedOn: null,
};

type Subscriber = () => void;

export interface IBadgeRepository {
  getState(): BadgeState;
  setState(state: BadgeState): void;
  subscribe(callback: Subscriber): () => void;
}
