const mockLog = jest.fn();
jest.mock('../src/shared/analytics/analytics', () => ({
  logAnalyticsEvent: (...args: unknown[]) => mockLog(...args),
}));

const mockBridge = {
  canPinWidgets: jest.fn(),
  requestPinWidget: jest.fn(),
  getWidgetStatus: jest.fn(),
};
let mockOs = 'android';
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
  },
}));

import {
  canPinWidgets,
  requestPinWidget,
} from '../src/shared/platform/widgetPin';

describe('widgetPin', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockOs = 'android';
    mockLog.mockReset();
    mockBridge.canPinWidgets.mockReset().mockResolvedValue(true);
    mockBridge.requestPinWidget.mockReset().mockResolvedValue('requested');
    mockBridge.getWidgetStatus
      .mockReset()
      .mockResolvedValue({ dayWidgetAdded: false });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('knows whether the launcher can pin', async () => {
    await expect(canPinWidgets()).resolves.toBe(true);
    mockBridge.canPinWidgets.mockResolvedValue(false);
    await expect(canPinWidgets()).resolves.toBe(false);
    mockBridge.canPinWidgets.mockRejectedValue(new Error('x'));
    await expect(canPinWidgets()).resolves.toBe(false);
  });

  it('does nothing on iOS', async () => {
    mockOs = 'ios';
    await expect(canPinWidgets()).resolves.toBe(false);
    await expect(requestPinWidget('day', 'coach')).resolves.toBe('unsupported');
    expect(mockBridge.requestPinWidget).not.toHaveBeenCalled();
  });

  it('asks the launcher and logs the request', async () => {
    await expect(requestPinWidget('day', 'onboarding')).resolves.toBe(
      'requested',
    );
    expect(mockBridge.requestPinWidget).toHaveBeenCalledWith('day');
    expect(mockLog).toHaveBeenCalledWith('widget_pin_requested', {
      kind: 'day',
      source: 'onboarding',
      outcome: 'requested',
      had_widget: false,
    });
  });

  it('can place the Next deadlines widget, and notices when it lands', async () => {
    await requestPinWidget('deadlines', 'widget_screen');
    expect(mockBridge.requestPinWidget).toHaveBeenCalledWith('deadlines');
    mockBridge.getWidgetStatus.mockResolvedValue({ deadlinesWidgetAdded: true });

    await jest.advanceTimersByTimeAsync(2000);

    expect(mockLog).toHaveBeenCalledWith(
      'widget_pin_confirmed',
      expect.objectContaining({ kind: 'deadlines' }),
    );
  });

  it('logs a confirmation once the widget shows up in the status', async () => {
    await requestPinWidget('day', 'coach');
    mockBridge.getWidgetStatus.mockResolvedValue({ dayWidgetAdded: true });

    await jest.advanceTimersByTimeAsync(2000);

    const confirmed = mockLog.mock.calls.filter(
      c => c[0] === 'widget_pin_confirmed',
    );
    expect(confirmed).toHaveLength(1);
    expect(confirmed[0][1]).toMatchObject({ kind: 'day', source: 'coach' });
  });

  it('stops watching if the person cancels the launcher prompt', async () => {
    await requestPinWidget('day', 'coach');
    await jest.advanceTimersByTimeAsync(60_000);
    expect(mockLog.mock.calls.some(c => c[0] === 'widget_pin_confirmed')).toBe(
      false,
    );
    const callsAfterGiveUp = mockBridge.getWidgetStatus.mock.calls.length;
    await jest.advanceTimersByTimeAsync(60_000);
    expect(mockBridge.getWidgetStatus.mock.calls.length).toBe(callsAfterGiveUp);
  });

  it('does not claim a new widget when one of that kind was already on the screen', async () => {
    mockBridge.getWidgetStatus.mockResolvedValue({ dayWidgetAdded: true });
    await requestPinWidget('day', 'widget_screen');
    await jest.advanceTimersByTimeAsync(5000);
    expect(mockLog.mock.calls.some(c => c[0] === 'widget_pin_confirmed')).toBe(
      false,
    );
    expect(mockLog).toHaveBeenCalledWith(
      'widget_pin_requested',
      expect.objectContaining({ had_widget: true }),
    );
  });

  it('reports unsupported when the launcher says no, and error when the call throws', async () => {
    mockBridge.requestPinWidget.mockResolvedValueOnce('unsupported');
    await expect(requestPinWidget('year', 'x')).resolves.toBe('unsupported');
    mockBridge.requestPinWidget.mockRejectedValueOnce(new Error('boom'));
    await expect(requestPinWidget('year', 'x')).resolves.toBe('error');
  });
});
