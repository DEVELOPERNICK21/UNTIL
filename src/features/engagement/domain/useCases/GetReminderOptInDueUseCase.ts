import type { IReminderOptInStore } from '../ports/IReminderOptInStore';
import { shouldOfferReminderOptIn } from '../reminderOptIn';

export class GetReminderOptInDueUseCase {
  constructor(
    private readonly store: IReminderOptInStore,
    private readonly getAppOpenCount: () => number,
    private readonly areRemindersEnabled: () => boolean,
  ) {}

  execute(options: { widgetsOnly: boolean; now?: number }): boolean {
    const history = this.store.getHistory();
    return shouldOfferReminderOptIn({
      appOpenCount: this.getAppOpenCount(),
      remindersEnabled: this.areRemindersEnabled(),
      asksSoFar: history.asks,
      lastAskedAt: history.lastAskedAt,
      now: options.now ?? Date.now(),
      widgetsOnly: options.widgetsOnly,
    });
  }
}
