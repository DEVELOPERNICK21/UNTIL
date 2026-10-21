import {
  REMINDER_OPT_IN_MAX_ASKS,
  REMINDER_OPT_IN_MIN_APP_OPENS,
  REMINDER_OPT_IN_RETRY_AFTER_MS,
  shouldOfferReminderOptIn,
  type ReminderOptInInput,
} from '../src/features/engagement/domain/reminderOptIn';
import { GetReminderOptInDueUseCase } from '../src/features/engagement/domain/useCases/GetReminderOptInDueUseCase';
import { RecordReminderOptInAskUseCase } from '../src/features/engagement/domain/useCases/RecordReminderOptInAskUseCase';
import type { IReminderOptInStore } from '../src/features/engagement/domain/ports/IReminderOptInStore';

const NOW = 1_000_000_000;
const due: ReminderOptInInput = {
  appOpenCount: REMINDER_OPT_IN_MIN_APP_OPENS,
  remindersEnabled: false,
  asksSoFar: 0,
  lastAskedAt: null,
  now: NOW,
  widgetsOnly: false,
};

describe('shouldOfferReminderOptIn', () => {
  it('offers to someone who has opened the app enough and has not been asked', () => {
    expect(shouldOfferReminderOptIn(due)).toBe(true);
  });

  it('waits until the first-run coaches are out of the way', () => {
    expect(
      shouldOfferReminderOptIn({
        ...due,
        appOpenCount: REMINDER_OPT_IN_MIN_APP_OPENS - 1,
      }),
    ).toBe(false);
  });

  it('never asks someone who already has reminders on, or wants widgets only', () => {
    expect(shouldOfferReminderOptIn({ ...due, remindersEnabled: true })).toBe(
      false,
    );
    expect(shouldOfferReminderOptIn({ ...due, widgetsOnly: true })).toBe(false);
  });

  it('asks at most twice, with a wait between', () => {
    expect(
      shouldOfferReminderOptIn({ ...due, asksSoFar: REMINDER_OPT_IN_MAX_ASKS }),
    ).toBe(false);
    expect(
      shouldOfferReminderOptIn({
        ...due,
        asksSoFar: 1,
        lastAskedAt: NOW - 1000,
      }),
    ).toBe(false);
    expect(
      shouldOfferReminderOptIn({
        ...due,
        asksSoFar: 1,
        lastAskedAt: NOW - REMINDER_OPT_IN_RETRY_AFTER_MS,
      }),
    ).toBe(true);
  });
});

describe('reminder opt-in use cases', () => {
  function makeStore() {
    let history = { asks: 0, lastAskedAt: null as number | null };
    const store: IReminderOptInStore = {
      getHistory: () => ({ ...history }),
      recordAsk: now => {
        history = { asks: history.asks + 1, lastAskedAt: now };
      },
    };
    return store;
  }

  it('is due until the ask is recorded, then waits', () => {
    const store = makeStore();
    const isDue = new GetReminderOptInDueUseCase(
      store,
      () => 6,
      () => false,
    );

    expect(isDue.execute({ widgetsOnly: false, now: NOW })).toBe(true);
    new RecordReminderOptInAskUseCase(store).execute(NOW);
    expect(isDue.execute({ widgetsOnly: false, now: NOW + 1000 })).toBe(false);
    expect(
      isDue.execute({
        widgetsOnly: false,
        now: NOW + REMINDER_OPT_IN_RETRY_AFTER_MS,
      }),
    ).toBe(true);
  });

  it('reads the live app-open count and reminder setting each time', () => {
    const store = makeStore();
    let opens = 1;
    let enabled = false;
    const isDue = new GetReminderOptInDueUseCase(
      store,
      () => opens,
      () => enabled,
    );

    expect(isDue.execute({ widgetsOnly: false, now: NOW })).toBe(false);
    opens = REMINDER_OPT_IN_MIN_APP_OPENS;
    expect(isDue.execute({ widgetsOnly: false, now: NOW })).toBe(true);
    enabled = true;
    expect(isDue.execute({ widgetsOnly: false, now: NOW })).toBe(false);
  });
});
