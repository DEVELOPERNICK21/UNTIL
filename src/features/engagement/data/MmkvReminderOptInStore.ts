/**
 * MMKV-backed history of reminder offers.
 */

import type {
  IReminderOptInStore,
  ReminderOptInHistory,
} from '../domain/ports/IReminderOptInStore';
import { STORAGE_KEYS } from '../../../shared/persistence/schema';
import { getNumber, setNumber } from '../../../shared/persistence/mmkv';

export class MmkvReminderOptInStore implements IReminderOptInStore {
  getHistory(): ReminderOptInHistory {
    return {
      asks: getNumber(STORAGE_KEYS.REMINDER_OPT_IN_ASKS) ?? 0,
      lastAskedAt: getNumber(STORAGE_KEYS.REMINDER_OPT_IN_LAST_ASK_AT) ?? null,
    };
  }

  recordAsk(now: number): void {
    setNumber(
      STORAGE_KEYS.REMINDER_OPT_IN_ASKS,
      (getNumber(STORAGE_KEYS.REMINDER_OPT_IN_ASKS) ?? 0) + 1,
    );
    setNumber(STORAGE_KEYS.REMINDER_OPT_IN_LAST_ASK_AT, now);
  }
}
