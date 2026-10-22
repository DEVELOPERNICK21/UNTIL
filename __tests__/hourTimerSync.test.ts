const mockStore = new Map<string, string>();
jest.mock('../src/shared/persistence/mmkv', () => ({
  getString: (key: string) => mockStore.get(key),
  setString: (key: string, value: string) => void mockStore.set(key, value),
  getNumber: () => undefined,
  setNumber: jest.fn(),
  getBoolean: () => undefined,
  setBoolean: jest.fn(),
  remove: jest.fn(),
  clearAll: jest.fn(),
}));
const mockBridge = {
  setHourCalculationState: jest.fn(),
  updateWidgets: jest.fn(),
  updateActivity: jest.fn(),
};
let mockOs = 'ios';
jest.mock('react-native', () => ({
  Platform: {
    get OS() {
      return mockOs;
    },
  },
  NativeModules: {
    get WidgetBridge() {
      return mockBridge;
    },
    get LiveActivityBridge() {
      return mockBridge;
    },
  },
}));

import {
  configureWidgetSync,
  getHourCalculationState,
  syncHourCalculationWidget,
} from '../src/features/widgets/data/WidgetSync';
import { STORAGE_KEYS } from '../src/shared/persistence/schema';

const stored = () =>
  JSON.parse(mockStore.get(STORAGE_KEYS.HOUR_CALCULATION_WIDGET) ?? '{}');

describe('syncHourCalculationWidget', () => {
  beforeEach(() => {
    mockStore.clear();
    mockOs = 'ios';
    Object.values(mockBridge).forEach(fn => fn.mockClear());
    jest.useFakeTimers().setSystemTime(1_800_000_000_000);
    // What the island state builder reads from the app. Only the hour timer matters here.
    configureWidgetSync({
      syncWidgetUseCase: { execute: () => ({}) },
      getCustomCountersUseCase: { execute: () => [] },
      getCountdownsUseCase: { execute: () => [] },
      getDailyTaskStatsUseCase: {
        getWidgetPayload: () => ({ completed: 0, total: 0 }),
      },
      getAccessStateUseCase: {
        execute: () => ({ isPremium: false, trialActive: false }),
      },
    } as never);
  });
  afterEach(() => jest.useRealTimers());

  it('starts and stops the timer from the app, banking the time', () => {
    syncHourCalculationWidget({ toggle: true });
    expect(getHourCalculationState()).toMatchObject({
      isRunning: true,
      startTimeMs: 1_800_000_000_000,
    });

    jest.setSystemTime(1_800_000_000_000 + 125_000);
    syncHourCalculationWidget({ toggle: true });
    expect(getHourCalculationState()).toMatchObject({
      isRunning: false,
      totalElapsedMs: 125_000,
    });
  });

  it('resets a running timer to zero and stopped, keeping the title', () => {
    syncHourCalculationWidget({ title: 'Office' });
    syncHourCalculationWidget({ toggle: true });
    syncHourCalculationWidget({ reset: true });
    expect(stored()).toEqual({
      title: 'Office',
      isRunning: false,
      startTimeMs: 0,
      totalElapsedMs: 0,
    });
  });

  it('tells the iOS widget, the watch and the island straight away', () => {
    syncHourCalculationWidget({ reset: true });
    expect(mockBridge.setHourCalculationState).toHaveBeenCalledTimes(1);
    expect(mockBridge.updateActivity).toHaveBeenCalledTimes(1);
  });

  it('refreshes the Android widgets instead', () => {
    mockOs = 'android';
    syncHourCalculationWidget({ toggle: true });
    expect(mockBridge.updateWidgets).toHaveBeenCalledTimes(1);
    expect(mockBridge.setHourCalculationState).not.toHaveBeenCalled();
  });

  it('keeps a long title short and a blank one as the default', () => {
    syncHourCalculationWidget({ title: 'T'.repeat(200) });
    expect(getHourCalculationState().title.length).toBeLessThanOrEqual(40);
    syncHourCalculationWidget({ title: '   ' });
    expect(getHourCalculationState().title).toBe('Hour timer');
  });

  it('reading a broken stored state gives the stopped default instead of throwing', () => {
    mockStore.set(STORAGE_KEYS.HOUR_CALCULATION_WIDGET, '{not json');
    expect(getHourCalculationState()).toMatchObject({
      isRunning: false,
      totalElapsedMs: 0,
    });
  });

  it('still saves the reset when the island refresh throws', () => {
    mockBridge.updateActivity.mockImplementationOnce(() => {
      throw new Error('island unavailable');
    });
    syncHourCalculationWidget({ toggle: true });
    expect(() => syncHourCalculationWidget({ reset: true })).not.toThrow();
    expect(getHourCalculationState().isRunning).toBe(false);
    expect(getHourCalculationState().totalElapsedMs).toBe(0);
  });
});
