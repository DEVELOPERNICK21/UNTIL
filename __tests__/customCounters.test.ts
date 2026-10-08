/**
 * The counter widget and the watch change the count while the app is closed. The app has to
 * take that count in before it pushes its own, or their taps are lost.
 */

const mockCalls: string[] = [];
const mockBridge = {
  getCustomCountersFromAppGroup: jest.fn(),
  setCustomCounters: jest.fn((json: string) => {
    mockCalls.push(`push:${json}`);
  }),
};

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  NativeModules: {
    get WidgetBridge() {
      return mockBridge;
    },
  },
}));

jest.mock('../src/persistence/mmkv', () => ({
  getString: () => undefined,
  setString: jest.fn(),
  getNumber: () => undefined,
  setNumber: jest.fn(),
  getBoolean: () => undefined,
  setBoolean: jest.fn(),
  remove: jest.fn(),
  clearAll: jest.fn(),
}));

import {
  configureWidgetSync,
  syncCustomCountersAfterAdopting,
} from '../src/infrastructure/WidgetSync';

let appCounters = [{ id: 'c1', title: 'Water', count: 0 }];

beforeEach(() => {
  mockCalls.length = 0;
  appCounters = [{ id: 'c1', title: 'Water', count: 0 }];
  mockBridge.getCustomCountersFromAppGroup.mockReset();
  mockBridge.setCustomCounters.mockClear();
  configureWidgetSync({
    getCustomCountersUseCase: { execute: () => appCounters },
  } as never);
});

describe('syncCustomCountersAfterAdopting', () => {
  it('adopts the shared count first, then pushes the app count', async () => {
    mockBridge.getCustomCountersFromAppGroup.mockResolvedValue(
      JSON.stringify([{ id: 'c1', title: 'Water', count: 2 }]),
    );
    await syncCustomCountersAfterAdopting(counters => {
      mockCalls.push(`adopt:${counters[0].count}`);
      appCounters = counters;
    });
    expect(mockCalls).toEqual([
      'adopt:2',
      `push:${JSON.stringify([{ id: 'c1', title: 'Water', count: 2 }])}`,
    ]);
  });

  it('keeps the app count when nothing is stored yet', async () => {
    mockBridge.getCustomCountersFromAppGroup.mockResolvedValue(null);
    const adopt = jest.fn();
    await syncCustomCountersAfterAdopting(adopt);
    expect(adopt).not.toHaveBeenCalled();
    expect(mockBridge.setCustomCounters).toHaveBeenCalledTimes(1);
  });

  it('ignores unreadable data and still pushes', async () => {
    mockBridge.getCustomCountersFromAppGroup.mockResolvedValue('{oops');
    const adopt = jest.fn();
    await syncCustomCountersAfterAdopting(adopt);
    expect(adopt).not.toHaveBeenCalled();
    expect(mockBridge.setCustomCounters).toHaveBeenCalledTimes(1);
  });

  it('still pushes when the bridge call fails', async () => {
    mockBridge.getCustomCountersFromAppGroup.mockRejectedValue(new Error('no'));
    await syncCustomCountersAfterAdopting(jest.fn());
    expect(mockBridge.setCustomCounters).toHaveBeenCalledTimes(1);
  });
});
