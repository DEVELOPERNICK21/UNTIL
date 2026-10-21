const mockStore = new Map<string, number>();
const mockPlatform = { OS: 'android' };
jest.mock('react-native', () => ({
  get Platform() {
    return mockPlatform;
  },
}));
jest.mock('../src/shared/persistence/mmkv', () => ({
  getNumber: (key: string) => mockStore.get(key),
  setNumber: (key: string, value: number) => void mockStore.set(key, value),
}));
const mockLog = jest.fn();
jest.mock('../src/shared/analytics/analytics', () => ({
  logAnalyticsEvent: (...args: unknown[]) => mockLog(...args),
}));
const mockGetSettings = jest.fn();
const mockRequest = jest.fn();
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    getNotificationSettings: () => mockGetSettings(),
    requestPermission: () => mockRequest(),
  },
}));

import {
  hasNotificationPermission,
  requestNotificationPermission,
} from '../src/shared/platform/notificationPermission';
import { MS_PER_DAY } from '../src/shared/time/constants';

describe('requestNotificationPermission', () => {
  beforeEach(() => {
    mockPlatform.OS = 'android';
    mockStore.clear();
    mockLog.mockReset();
    mockGetSettings.mockReset();
    mockRequest.mockReset();
  });

  it('says yes without asking or logging when it is already granted', async () => {
    mockGetSettings.mockResolvedValue({ authorizationStatus: 1 });
    await expect(requestNotificationPermission('a')).resolves.toBe(true);
    expect(mockRequest).not.toHaveBeenCalled();
    expect(mockLog).not.toHaveBeenCalled();
  });

  it('asks once and logs the answer', async () => {
    mockGetSettings.mockResolvedValue({ authorizationStatus: 0 });
    mockRequest.mockResolvedValue({ authorizationStatus: 1 });
    await expect(requestNotificationPermission('onboarding_day2')).resolves.toBe(true);
    expect(mockLog).toHaveBeenCalledWith('notification_permission_result', {
      granted: true,
      source: 'onboarding_day2',
    });
  });

  it('does not ask again for a few days after a no', async () => {
    mockGetSettings.mockResolvedValue({ authorizationStatus: 0 });
    mockRequest.mockResolvedValue({ authorizationStatus: 0 });
    await requestNotificationPermission('a');
    await expect(requestNotificationPermission('b')).resolves.toBe(false);
    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(mockLog).toHaveBeenCalledTimes(1);
  });

  it('asks again once the wait is over', async () => {
    mockGetSettings.mockResolvedValue({ authorizationStatus: 0 });
    mockRequest.mockResolvedValue({ authorizationStatus: 0 });
    const now = Date.now();
    const spy = jest.spyOn(Date, 'now');
    spy.mockReturnValue(now);
    await requestNotificationPermission('a');
    spy.mockReturnValue(now + 4 * MS_PER_DAY);
    await requestNotificationPermission('b');
    spy.mockRestore();
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });

  it('shares one answer between callers that ask at the same moment', async () => {
    mockGetSettings.mockResolvedValue({ authorizationStatus: 0 });
    mockRequest.mockResolvedValue({ authorizationStatus: 1 });
    const [a, b] = await Promise.all([
      requestNotificationPermission('a'),
      requestNotificationPermission('b'),
    ]);
    expect([a, b]).toEqual([true, true]);
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  it('stays off iOS unless the feature opts in', async () => {
    mockPlatform.OS = 'ios';
    mockGetSettings.mockResolvedValue({ authorizationStatus: 0 });
    mockRequest.mockResolvedValue({ authorizationStatus: 1 });
    await expect(requestNotificationPermission('old_reminder')).resolves.toBe(false);
    expect(mockRequest).not.toHaveBeenCalled();
    await expect(requestNotificationPermission('task_deadline', { allowIos: true })).resolves.toBe(true);
  });

  it('reads the current permission without prompting', async () => {
    mockGetSettings.mockResolvedValue({ authorizationStatus: 2 });
    await expect(hasNotificationPermission()).resolves.toBe(true);
    mockGetSettings.mockResolvedValue({ authorizationStatus: 0 });
    await expect(hasNotificationPermission()).resolves.toBe(false);
    expect(mockRequest).not.toHaveBeenCalled();
  });
});

describe('requestNotificationPermission when the person just asked for it', () => {
  beforeEach(() => {
    mockStore.clear();
    mockLog.mockReset();
    mockGetSettings.mockReset();
    mockRequest.mockReset();
  });

  it('asks even inside the wait that follows an earlier no', async () => {
    mockGetSettings.mockResolvedValue({ authorizationStatus: 0 });
    mockRequest.mockResolvedValue({ authorizationStatus: 0 });
    await requestNotificationPermission('trial_reminder');

    mockRequest.mockResolvedValue({ authorizationStatus: 1 });
    await expect(
      requestNotificationPermission('opt_in_sheet', { userInitiated: true }),
    ).resolves.toBe(true);
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });
});
