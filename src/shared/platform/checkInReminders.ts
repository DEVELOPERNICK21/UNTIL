/**
 * Daily check-in reminder port.
 *
 * Onboarding asks how people want UNTIL to show up. When they pick daily check-ins it has to turn
 * the reminder on, but onboarding never imports the engagement feature, so it goes through this
 * module. The composition root (app/di) registers the real implementation.
 */

export type CheckInRemindersApi = {
  /** Asks for notification permission and, if given, schedules the daily reminder. True when on. */
  enable(source: string): Promise<boolean>;
};

let implementation: CheckInRemindersApi | null = null;

export function registerCheckInReminders(next: CheckInRemindersApi): void {
  implementation = next;
}

export const checkInReminders: CheckInRemindersApi = {
  // Before registration (tests, early start-up) there is nothing to turn on.
  enable: source => implementation?.enable(source) ?? Promise.resolve(false),
};
