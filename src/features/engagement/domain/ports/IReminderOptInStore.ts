/**
 * Port for how often the daily check-in reminder has been offered.
 */

export interface ReminderOptInHistory {
  asks: number;
  lastAskedAt: number | null;
}

export interface IReminderOptInStore {
  getHistory(): ReminderOptInHistory;
  recordAsk(now: number): void;
}
