import type { IReminderOptInStore } from '../ports/IReminderOptInStore';

export class RecordReminderOptInAskUseCase {
  constructor(private readonly store: IReminderOptInStore) {}

  execute(now: number = Date.now()): void {
    this.store.recordAsk(now);
  }
}
