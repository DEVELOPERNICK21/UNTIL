/**
 * The Dynamic Island must never claim to be running when it is not, and must come back by
 * itself when iOS ends it after its time limit.
 */

const mockStore = new Map<string, string | number | boolean>();
const mockBridge = {
  startActivity: jest.fn(),
  updateActivity: jest.fn(),
  getStatus: jest.fn(),
  getActiveWidget: jest.fn(),
  endActivity: jest.fn(),
};

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  NativeModules: {
    get LiveActivityBridge() {
      return mockBridge;
    },
  },
}));

jest.mock('../src/shared/persistence/mmkv', () => ({
  getString: (key: string) => mockStore.get(key) as string | undefined,
  setString: (key: string, value: string) => mockStore.set(key, value),
  getNumber: (key: string) => mockStore.get(key) as number | undefined,
  setNumber: (key: string, value: number) => mockStore.set(key, value),
  getBoolean: (key: string) => mockStore.get(key) as boolean | undefined,
  setBoolean: (key: string, value: boolean) => mockStore.set(key, value),
  remove: (key: string) => mockStore.delete(key),
  clearAll: () => mockStore.clear(),
}));

import {
  configureWidgetSync,
  endLiveActivity,
  getLiveActivityStatus,
  refreshLiveActivity,
  startLiveActivity,
} from '../src/features/widgets/data/WidgetSync';
import { STORAGE_KEYS } from '../src/shared/persistence/schema';

const cache = {
  dayProgress: 0.5,
  dayPercentDone: 50,
  dayPercentLeft: 50,
  dayHoursPassed: 12,
  dayHoursLeft: 12,
  monthProgress: 0.1,
  monthDaysPassed: 3,
  monthDaysLeft: 27,
  monthPercent: 10,
  yearProgress: 0.2,
  yearDaysPassed: 70,
  yearDaysLeft: 295,
  yearPercent: 20,
};

const HOUR = 60 * 60 * 1000;

function status(partial: Partial<Record<string, unknown>> = {}) {
  return {
    supported: true,
    enabled: true,
    active: false,
    state: 'none',
    ...partial,
  };
}

/** refreshLiveActivity is fire and forget; let its promise chain settle. */
async function settle() {
  for (let i = 0; i < 8; i++) await Promise.resolve();
}

beforeEach(() => {
  mockStore.clear();
  Object.values(mockBridge).forEach(fn => fn.mockReset());
  mockBridge.getActiveWidget.mockResolvedValue(null);
  mockBridge.startActivity.mockResolvedValue({ started: true });
  mockBridge.getStatus.mockResolvedValue(status());
  configureWidgetSync({
    syncWidgetUseCase: { execute: () => cache },
    getDailyTaskStatsUseCase: { getWidgetPayload: () => null },
    getAccessStateUseCase: { execute: () => ({}) },
    getCustomCountersUseCase: {},
    getCountdownsUseCase: {},
  } as never);
});

describe('startLiveActivity', () => {
  it('reports success and remembers that the user wants the island on', async () => {
    await expect(startLiveActivity('day')).resolves.toEqual({ ok: true });
    expect(mockStore.get(STORAGE_KEYS.LIVE_ACTIVITY_ENABLED)).toBe(true);
    expect(typeof mockStore.get(STORAGE_KEYS.LIVE_ACTIVITY_STARTED_AT)).toBe(
      'number',
    );
  });

  it('says so when Live Activities are turned off, and does not remember a start', async () => {
    mockBridge.startActivity.mockRejectedValue({ code: 'disabled' });
    await expect(startLiveActivity()).resolves.toEqual({
      ok: false,
      reason: 'disabled',
    });
    expect(mockStore.get(STORAGE_KEYS.LIVE_ACTIVITY_ENABLED)).toBeUndefined();
  });

  it('maps an old iOS and any other failure', async () => {
    mockBridge.startActivity.mockRejectedValue({ code: 'unsupported' });
    await expect(startLiveActivity()).resolves.toEqual({
      ok: false,
      reason: 'unsupported',
    });
    mockBridge.startActivity.mockRejectedValue(new Error('boom'));
    await expect(startLiveActivity()).resolves.toEqual({
      ok: false,
      reason: 'failed',
    });
  });
});

describe('getLiveActivityStatus', () => {
  it('fills in safe defaults when the bridge answers with less', async () => {
    mockBridge.getStatus.mockResolvedValue({ supported: true });
    await expect(getLiveActivityStatus()).resolves.toEqual({
      supported: true,
      enabled: false,
      active: false,
      state: 'none',
    });
  });

  it('treats a failing bridge as not running', async () => {
    mockBridge.getStatus.mockRejectedValue(new Error('nope'));
    await expect(getLiveActivityStatus()).resolves.toMatchObject({
      active: false,
    });
  });
});

describe('refreshLiveActivity', () => {
  it('just updates a running activity', async () => {
    mockStore.set(STORAGE_KEYS.LIVE_ACTIVITY_ENABLED, true);
    mockBridge.getStatus.mockResolvedValue(status({ active: true, state: 'active' }));
    refreshLiveActivity();
    await settle();
    expect(mockBridge.startActivity).not.toHaveBeenCalled();
    expect(mockBridge.updateActivity).toHaveBeenCalledTimes(1);
  });

  it('starts it again when iOS ended it', async () => {
    mockStore.set(STORAGE_KEYS.LIVE_ACTIVITY_ENABLED, true);
    mockStore.set(STORAGE_KEYS.LIVE_ACTIVITY_STARTED_AT, Date.now() - HOUR);
    mockBridge.getStatus.mockResolvedValue(status({ state: 'ended' }));
    refreshLiveActivity();
    await settle();
    expect(mockBridge.startActivity).toHaveBeenCalledTimes(1);
    expect(mockBridge.updateActivity).not.toHaveBeenCalled();
  });

  it('starts it again when it is gone after the time limit', async () => {
    mockStore.set(STORAGE_KEYS.LIVE_ACTIVITY_ENABLED, true);
    mockStore.set(STORAGE_KEYS.LIVE_ACTIVITY_STARTED_AT, Date.now() - 9 * HOUR);
    mockBridge.getStatus.mockResolvedValue(status({ state: 'none' }));
    refreshLiveActivity();
    await settle();
    expect(mockBridge.startActivity).toHaveBeenCalledTimes(1);
  });

  it('leaves it off when the user swiped it away early', async () => {
    mockStore.set(STORAGE_KEYS.LIVE_ACTIVITY_ENABLED, true);
    mockStore.set(STORAGE_KEYS.LIVE_ACTIVITY_STARTED_AT, Date.now() - HOUR);
    mockBridge.getStatus.mockResolvedValue(status({ state: 'none' }));
    refreshLiveActivity();
    await settle();
    expect(mockBridge.startActivity).not.toHaveBeenCalled();
    expect(mockStore.get(STORAGE_KEYS.LIVE_ACTIVITY_ENABLED)).toBe(false);
  });

  it('never starts one the user did not ask for, or after Stop', async () => {
    refreshLiveActivity();
    await settle();
    expect(mockBridge.startActivity).not.toHaveBeenCalled();

    await startLiveActivity();
    mockBridge.startActivity.mockClear();
    endLiveActivity();
    mockBridge.getStatus.mockResolvedValue(status({ state: 'ended' }));
    refreshLiveActivity();
    await settle();
    expect(mockBridge.startActivity).not.toHaveBeenCalled();
  });

  it('does not try to start when Live Activities are off', async () => {
    mockStore.set(STORAGE_KEYS.LIVE_ACTIVITY_ENABLED, true);
    mockStore.set(STORAGE_KEYS.LIVE_ACTIVITY_STARTED_AT, Date.now() - 9 * HOUR);
    mockBridge.getStatus.mockResolvedValue(status({ enabled: false, state: 'none' }));
    refreshLiveActivity();
    await settle();
    expect(mockBridge.startActivity).not.toHaveBeenCalled();
  });
});
