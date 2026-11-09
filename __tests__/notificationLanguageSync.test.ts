const mockScheduleRetentionNotifications = jest.fn(async () => undefined);
const mockRefreshTaskDeadlineNotifications = jest.fn(async () => undefined);
const mockSchedulePresenceStreakSaver = jest.fn(async () => undefined);
const mockRefreshDay2ReengagementLanguage = jest.fn(async () => undefined);

jest.mock('../src/features/engagement', () => ({
  scheduleRetentionNotifications: (...args: unknown[]) =>
    (mockScheduleRetentionNotifications as jest.Mock)(...args),
  refreshTaskDeadlineNotifications: () =>
    mockRefreshTaskDeadlineNotifications(),
}));
jest.mock('../src/features/presence', () => ({
  schedulePresenceStreakSaver: (...args: unknown[]) =>
    (mockSchedulePresenceStreakSaver as jest.Mock)(...args),
}));
jest.mock('../src/features/onboarding', () => ({
  refreshDay2ReengagementLanguage: () => mockRefreshDay2ReengagementLanguage(),
}));
jest.mock('../src/app/di', () => ({
  getPresenceStreakUseCase: {
    execute: () => ({ count: 3, noticedToday: false }),
  },
}));

import { startNotificationLanguageSync } from '../src/app/notificationLanguageSync';
import { setLanguage } from '../src/shared/i18n/translate';

afterEach(() => {
  setLanguage('en');
  jest.clearAllMocks();
});

describe('notification language sync', () => {
  it('rewrites pending reminders when the language changes, and not when it does not', () => {
    const stop = startNotificationLanguageSync();
    expect(startNotificationLanguageSync()).toBe(stop);

    setLanguage('en');
    expect(mockScheduleRetentionNotifications).not.toHaveBeenCalled();

    setLanguage('hi');
    expect(mockScheduleRetentionNotifications).toHaveBeenCalledTimes(1);
    expect(mockScheduleRetentionNotifications).toHaveBeenCalledWith(
      expect.any(Date),
      {
        force: true,
      },
    );
    expect(mockRefreshTaskDeadlineNotifications).toHaveBeenCalledTimes(1);
    expect(mockSchedulePresenceStreakSaver).toHaveBeenCalledWith({
      count: 3,
      noticedToday: false,
    });
    expect(mockRefreshDay2ReengagementLanguage).toHaveBeenCalledTimes(1);

    stop();
    setLanguage('de');
    expect(mockScheduleRetentionNotifications).toHaveBeenCalledTimes(1);
  });
});
