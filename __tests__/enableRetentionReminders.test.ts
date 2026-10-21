const mockStrings = new Map<string, string>();
const mockNumbers = new Map<string, number>();
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
jest.mock('../src/shared/persistence/mmkv', () => ({
  getString: (key: string) => mockStrings.get(key),
  setString: (key: string, value: string) => void mockStrings.set(key, value),
  getNumber: (key: string) => mockNumbers.get(key),
  setNumber: (key: string, value: number) => void mockNumbers.set(key, value),
}));
const mockLog = jest.fn();
jest.mock('../src/shared/analytics/analytics', () => ({
  logAnalyticsEvent: (...args: unknown[]) => mockLog(...args),
}));
const mockRequestPermission = jest.fn();
jest.mock('../src/shared/platform/notificationPermission', () => ({
  requestNotificationPermission: (...args: unknown[]) =>
    mockRequestPermission(...args),
}));
const mockNotifee = {
  createChannel: jest.fn().mockResolvedValue('retention'),
  createTriggerNotification: jest.fn().mockResolvedValue('id'),
  cancelNotification: jest.fn().mockResolvedValue(undefined),
};
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: mockNotifee,
  TriggerType: { TIMESTAMP: 0 },
}));

import {
  enableRetentionNotificationsWithPermission,
  getRetentionNotificationsEnabled,
} from '../src/features/engagement/services/retentionNotifications';
import { STORAGE_KEYS } from '../src/shared/persistence/schema';

describe('enableRetentionNotificationsWithPermission', () => {
  beforeEach(() => {
    mockStrings.clear();
    mockNumbers.clear();
    mockLog.mockReset();
    mockRequestPermission.mockReset();
    mockNotifee.createTriggerNotification.mockClear();
  });

  it('turns reminders on and schedules them once notifications are allowed', async () => {
    mockRequestPermission.mockResolvedValue(true);

    await expect(
      enableRetentionNotificationsWithPermission('opt_in_sheet'),
    ).resolves.toBe(true);

    expect(mockRequestPermission).toHaveBeenCalledWith('opt_in_sheet', {
      userInitiated: true,
      allowIos: true,
    });
    expect(getRetentionNotificationsEnabled()).toBe(true);
    expect(mockStrings.get(STORAGE_KEYS.RETENTION_NOTIFICATIONS_ENABLED)).toBe(
      '1',
    );
    expect(mockNotifee.createTriggerNotification).toHaveBeenCalled();
    expect(mockLog).toHaveBeenCalledWith('retention_notification_enabled', {
      source: 'opt_in_sheet',
    });
  });

  it('leaves reminders off when the person says no, so Settings never shows a switch that cannot work', async () => {
    mockRequestPermission.mockResolvedValue(false);

    await expect(
      enableRetentionNotificationsWithPermission('onboarding_cadence'),
    ).resolves.toBe(false);

    expect(getRetentionNotificationsEnabled()).toBe(false);
    expect(mockNotifee.createTriggerNotification).not.toHaveBeenCalled();
    expect(mockLog).toHaveBeenCalledWith(
      'retention_notification_permission_denied',
      {
        source: 'onboarding_cadence',
      },
    );
  });
});
