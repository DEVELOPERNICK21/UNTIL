/**
 * The whole Pause screen, from the first breath to the close, on a fake clock.
 * Checks what the person sees at each step, that nothing is skipped, that the screen stays on only
 * while breathing, and that only two anonymous events are logged.
 */

import React from 'react';
import { Linking } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { PauseScreen } from '../src/features/pause/ui/PauseScreen';
import { ROUND_MS } from '../src/features/pause/domain/breathing';

// ui/index pulls in Skia grids; none of them are rendered here.
jest.mock('@shopify/react-native-skia', () => ({
  Canvas: () => null,
  Path: () => null,
  Skia: {},
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
let mockCanGoBack = true;
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    canGoBack: () => mockCanGoBack,
    goBack: mockGoBack,
    navigate: mockNavigate,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

let mockTasks: Array<{ id: string; title: string }> = [];
jest.mock('../src/features/tasks', () => ({
  useOpenTasksToday: () => mockTasks,
}));

const mockLogEvent = jest.fn();
jest.mock('../src/shared/analytics/analytics', () => ({
  logAnalyticsEvent: (...a: unknown[]) => {
    mockLogEvent(...a);
    return Promise.resolve();
  },
}));

const mockKeepAwake = jest.fn();
jest.mock('../src/shared/platform/keepAwake', () => ({
  setKeepScreenAwake: (...a: unknown[]) => mockKeepAwake(...a),
}));

// Echo keys and parameters so each piece of text can be told apart without loading the language files.
jest.mock('../src/shared/i18n/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key}|${JSON.stringify(params)}` : key,
  }),
}));

let renderer: ReactTestRenderer.ReactTestRenderer;
let openURL: jest.SpyInstance;

const text = () => JSON.stringify(renderer.toJSON());
const has = (s: string) => text().includes(s);
const advance = (ms: number) => act(() => void jest.advanceTimersByTime(ms));

function press(label: string) {
  const node = renderer.root.findAll(
    n => n.props?.accessibilityLabel === label && typeof n.props.onPress === 'function',
  )[0];
  if (!node) throw new Error(`no button labelled "${label}"`);
  act(() => node.props.onPress());
}

async function mount() {
  await act(async () => {
    renderer = ReactTestRenderer.create(<PauseScreen />);
  });
}

/** Finish the breathing round on its own. */
const finishRound = () => advance(ROUND_MS + 200);

describe('PauseScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockTasks = [];
    mockCanGoBack = true;
    [mockGoBack, mockNavigate, mockLogEvent, mockKeepAwake].forEach(m => m.mockClear());
    openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });
  afterEach(() => {
    openURL.mockRestore();
    jest.useRealTimers();
  });

  it('opens straight into breathing, with nothing to choose and no timer', async () => {
    await mount();
    expect(has('pause.breathe.in')).toBe(true);
    expect(has('pause.breathe.hint')).toBe(true);
    expect(has('pause.checkin.title')).toBe(false);
  });

  it('asks how it is now when the round is over', async () => {
    await mount();
    finishRound();
    expect(has('pause.checkin.title')).toBe(true);
    expect(has('pause.checkin.calmer')).toBe(true);
    expect(has('pause.checkin.tight')).toBe(true);
  });

  it('keeps the screen awake while breathing, and lets go afterwards', async () => {
    await mount();
    expect(mockKeepAwake).toHaveBeenLastCalledWith(true);
    finishRound();
    expect(mockKeepAwake).toHaveBeenLastCalledWith(false);
  });

  it('gives "still tight" one more, slower, round with its own words', async () => {
    await mount();
    finishRound();
    press('pause.checkin.tight');
    expect(has('pause.breathe.hintSlow')).toBe(true);
    expect(has('pause.checkin.title')).toBe(false);
  });

  it('does not loop forever: still tight twice moves on and points to real help', async () => {
    await mount();
    finishRound();
    press('pause.checkin.tight');
    finishRound();
    press('pause.checkin.tight');
    expect(has('pause.weight.title')).toBe(true);

    press('pause.weight.skip');
    expect(has('pause.help.tight')).toBe(true);
    press('pause.help.link');
    expect(openURL).toHaveBeenCalledWith('https://findahelpline.com/');
  });

  it('asks what feels heavy after a calmer round, and can be skipped', async () => {
    await mount();
    finishRound();
    press('pause.checkin.calmer');
    expect(has('pause.weight.title')).toBe(true);
    ['load', 'time', 'event', 'night', 'unsure'].forEach(w => {
      expect(has(`pause.weight.${w}`)).toBe(true);
    });
    press('pause.weight.skip');
    expect(has('pause.end.title')).toBe(true);
    expect(has('pause.help.tight')).toBe(false);
  });

  it.each(['time', 'event', 'night', 'unsure'])('shows the short path for "%s"', async weight => {
    await mount();
    finishRound();
    press('pause.checkin.same');
    press(`pause.weight.${weight}`);
    expect(has(`pause.${weight}.title`)).toBe(true);
    expect(has(`pause.${weight}.body`)).toBe(true);
    expect(has(`pause.${weight}.step`)).toBe(true);
    press('common.continue');
    expect(has('pause.end.title')).toBe(true);
  });

  describe('"too much to do"', () => {
    const toLoadPath = async () => {
      await mount();
      finishRound();
      press('pause.checkin.calmer');
      press('pause.weight.load');
    };

    it('asks to pick one of today\'s open tasks, and will not go on until one is picked', async () => {
      mockTasks = [
        { id: 'a', title: 'Reply to the landlord' },
        { id: 'b', title: 'Book the dentist' },
      ];
      await toLoadPath();
      expect(has('pause.load.title')).toBe(true);
      expect(has('Reply to the landlord')).toBe(true);
      expect(has('Book the dentist')).toBe(true);

      press('pause.load.go');
      expect(has('pause.load.pickFirst')).toBe(true);
      expect(has('pause.end.title')).toBe(false);

      press('Book the dentist');
      expect(has('pause.load.pickFirst')).toBe(false);
      press('pause.load.go');
      expect(has('pause.end.title')).toBe(true);
      expect(has('Book the dentist')).toBe(true);
    });

    it('with no open tasks, offers to think of one and goes on', async () => {
      await toLoadPath();
      expect(has('pause.load.noTasks')).toBe(true);
      press('pause.load.go');
      expect(has('pause.end.title')).toBe(true);
      expect(has('pause.end.focus')).toBe(false);
    });

    it('"not now" leaves without choosing', async () => {
      mockTasks = [{ id: 'a', title: 'Reply to the landlord' }];
      await toLoadPath();
      press('common.notNow');
      expect(has('pause.end.title')).toBe(true);
      expect(has('Reply to the landlord')).toBe(false);
    });
  });

  it('ends quietly, with a small way to find someone to talk to', async () => {
    await mount();
    finishRound();
    press('pause.checkin.calmer');
    press('pause.weight.skip');
    expect(has('pause.end.body')).toBe(true);
    expect(has('pause.end.private')).toBe(true);
    press('pause.help.footer');
    expect(openURL).toHaveBeenCalledTimes(1);
  });

  it('closes by going back, or home when there is nothing to go back to', async () => {
    await mount();
    press('pause.close.a11y');
    expect(mockGoBack).toHaveBeenCalledTimes(1);

    mockCanGoBack = false;
    press('pause.close.a11y');
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('logs only that a pause started and that it finished, nothing about what was picked', async () => {
    mockTasks = [{ id: 'a', title: 'Reply to the landlord' }];
    await mount();
    expect(mockLogEvent).toHaveBeenCalledTimes(1);
    expect(mockLogEvent).toHaveBeenCalledWith('pause_started');

    finishRound();
    press('pause.checkin.tight');
    finishRound();
    press('pause.checkin.calmer');
    press('pause.weight.load');
    press('Reply to the landlord');
    press('pause.load.go');

    expect(mockLogEvent.mock.calls).toEqual([['pause_started'], ['pause_completed']]);
  });

  it('lets go of the screen, and keeps nothing running, when it is closed mid-breath', async () => {
    await mount();
    advance(5000);
    act(() => renderer.unmount());
    expect(mockKeepAwake).toHaveBeenLastCalledWith(false);

    // Whatever React and Animated still have to clean up fires and ends; the breathing never finishes.
    advance(ROUND_MS * 2);
    expect(jest.getTimerCount()).toBe(0);
    expect(mockLogEvent.mock.calls).toEqual([['pause_started']]);
  });
});
