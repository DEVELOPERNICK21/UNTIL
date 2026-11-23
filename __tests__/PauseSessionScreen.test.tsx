/**
 * One whole Pause session, from "ready" (or the panic button) to the close, on a fake clock: what the person
 * sees at each step, that nothing is skipped, that calm minutes are recorded once, that the screen stays on only
 * while practising, and that only two anonymous events are logged.
 */

import React from 'react';
import { Linking } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { PauseSessionScreen } from '../src/features/pause/ui/PauseSessionScreen';

jest.mock('@shopify/react-native-skia', () => ({ Canvas: () => null, Path: () => null, Skia: {} }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

const mockGoBack = jest.fn();
const mockPopToTop = jest.fn();
const mockNavigate = jest.fn();
let mockCanGoBack = true;
let mockParams: { practice: string; instant?: boolean } = { practice: 'sigh', instant: true };
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    canGoBack: () => mockCanGoBack,
    goBack: mockGoBack,
    popToTop: mockPopToTop,
    navigate: mockNavigate,
  }),
  useRoute: () => ({ params: mockParams }),
  useFocusEffect: () => {},
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

let mockTasks: Array<{ id: string; title: string }> = [];
jest.mock('../src/features/tasks', () => ({ useOpenTasksToday: () => mockTasks }));

const mockLogEvent = jest.fn();
jest.mock('../src/shared/analytics/analytics', () => ({
  logAnalyticsEvent: (...a: unknown[]) => {
    mockLogEvent(...a);
    return Promise.resolve();
  },
}));
const mockKeepAwake = jest.fn();
jest.mock('../src/shared/platform/keepAwake', () => ({ setKeepScreenAwake: (...a: unknown[]) => mockKeepAwake(...a) }));

const mockRecord = jest.fn();
jest.mock('../src/features/pause/hooks/usePauseProgress', () => ({
  usePauseProgress: () => ({ record: mockRecord }),
}));

// Echo keys and parameters so each piece of text can be told apart without loading the language files.
jest.mock('../src/shared/i18n/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key}|${JSON.stringify(params)}` : key),
    formatDate: () => '',
  }),
}));

let renderer: ReactTestRenderer.ReactTestRenderer;
let openURL: jest.SpyInstance;

function collect(node: unknown, out: string[]): string[] {
  if (node == null) return out;
  if (typeof node === 'string') out.push(node);
  else if (Array.isArray(node)) node.forEach(child => collect(child, out));
  else if (typeof node === 'object') collect((node as { children?: unknown }).children, out);
  return out;
}
const text = () => collect(renderer.toJSON(), []).join('\n');
const has = (s: string) => text().includes(s);
const advance = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms);
  });

function press(label: string) {
  const node = renderer.root.findAll(
    n => n.props?.accessibilityLabel === label && typeof n.props.onPress === 'function',
  )[0];
  if (!node) throw new Error(`no button labelled "${label}"`);
  act(() => node.props.onPress());
}

async function mount(params: typeof mockParams) {
  mockParams = params;
  await act(async () => {
    renderer = ReactTestRenderer.create(<PauseSessionScreen />);
  });
}

const finishSession = () => advance(10 * 60 * 1000);
const result = (patch = {}) => ({
  progress: { totalSeconds: 60, days: {}, sessions: 1, tried: ['sigh'], earned: ['first'] },
  gainedSeconds: 60,
  milestones: [],
  leveledUp: false,
  goalReachedNow: false,
  ...patch,
});

describe('PauseSessionScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockTasks = [];
    mockCanGoBack = true;
    [mockGoBack, mockPopToTop, mockNavigate, mockLogEvent, mockKeepAwake, mockRecord].forEach(m => m.mockClear());
    mockRecord.mockReturnValue(result());
    openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });
  afterEach(() => {
    openURL.mockRestore();
    jest.useRealTimers();
  });

  describe('the panic button', () => {
    it('starts breathing at once: no ready step, nothing to choose, no timer', async () => {
      await mount({ practice: 'sigh', instant: true });
      expect(has('pause.breathe.in')).toBe(true);
      expect(has('pause.practice.sigh.name')).toBe(true);
      expect(has('pause.ready.start')).toBe(false);
      expect(has('pause.checkin.title')).toBe(false);
    });

    it('records the minute when the session is over and shows what it added', async () => {
      await mount({ practice: 'sigh', instant: true });
      finishSession();
      press('pause.checkin.calmer');
      press('pause.weight.skip');
      expect(mockRecord).toHaveBeenCalledTimes(1);
      expect(mockRecord).toHaveBeenCalledWith('sigh', 63);
      expect(has('pause.end.gained|{"minutes":1}')).toBe(true);
    });
  });

  describe('a chosen practice', () => {
    it('opens on "ready", with what it is, how strong the evidence is, and lengths to pick', async () => {
      await mount({ practice: 'box' });
      expect(has('pause.practice.box.name')).toBe(true);
      expect(has('pause.practice.box.how')).toBe(true);
      expect(has('pause.evidence.early')).toBe(true);
      expect(has('pause.min|{"count":1}')).toBe(true);
      expect(has('pause.min|{"count":3}')).toBe(true);
      expect(has('pause.min|{"count":5}')).toBe(true);
      expect(has('pause.breathe.in')).toBe(false);
    });

    it('starts when told to, and runs for the length picked', async () => {
      await mount({ practice: 'coherent' });
      press('pause.min|{"count":5}');
      press('pause.ready.start');
      expect(has('pause.breathe.in')).toBe(true);
      advance(4 * 60 * 1000);
      expect(has('pause.checkin.title')).toBe(false);
      advance(2 * 60 * 1000);
      expect(has('pause.checkin.title')).toBe(true);
    });

    it('is honest that 4-7-8 has little research', async () => {
      await mount({ practice: 'wind' });
      expect(has('pause.evidence.little')).toBe(true);
    });
  });

  it('keeps the screen awake while practising, and lets go afterwards', async () => {
    await mount({ practice: 'sigh', instant: true });
    expect(mockKeepAwake).toHaveBeenLastCalledWith(true);
    finishSession();
    expect(mockKeepAwake).toHaveBeenLastCalledWith(false);
  });

  it('lets someone move on early after one breath, and records only what they practised', async () => {
    await mount({ practice: 'sigh', instant: true });
    advance(12000);
    press('common.continue');
    expect(has('pause.checkin.title')).toBe(true);
    press('pause.checkin.calmer');
    press('pause.weight.skip');
    expect(mockRecord).toHaveBeenCalledWith('sigh', 12);
  });

  it('gives "still tight" one gentler round and adds up the time', async () => {
    await mount({ practice: 'sigh', instant: true });
    finishSession();
    press('pause.checkin.tight');
    expect(has('pause.breathe.hintSlow')).toBe(true);
    expect(has('pause.practice.coherent.name')).toBe(true);
    finishSession();
    press('pause.checkin.calmer');
    press('pause.weight.skip');
    expect(mockRecord).toHaveBeenCalledWith('sigh', 63 + 66);
  });

  it('does not loop, and points to real help after two tight rounds', async () => {
    await mount({ practice: 'sigh', instant: true });
    finishSession();
    press('pause.checkin.tight');
    finishSession();
    press('pause.checkin.tight');
    expect(has('pause.weight.title')).toBe(true);
    press('pause.weight.skip');
    expect(has('pause.help.tight')).toBe(true);
    press('pause.help.link');
    expect(openURL).toHaveBeenCalledWith('https://findahelpline.com/');
  });

  describe('grounding', () => {
    it('walks 5, 4, 3, 2, 1 and will not move on until each is tapped', async () => {
      await mount({ practice: 'grounding' });
      press('pause.ready.start');
      const senses = ['see', 'touch', 'hear', 'smell', 'taste'];
      const counts = [5, 4, 3, 2, 1];
      senses.forEach((sense, i) => {
        expect(has(`pause.ground.${sense}`)).toBe(true);
        const dots = counts[i];
        const total = ` / ${dots}`;
        expect(renderer.root.findAll(n => typeof n.props?.accessibilityLabel === 'string' && n.props.accessibilityLabel.endsWith(total) && typeof n.props.onPress === 'function')).toHaveLength(dots);
        // Tapping the last dot counts all those before it as noticed.
        press(`${dots} / ${dots}`);
        press('common.continue');
      });
      expect(has('pause.checkin.title')).toBe(true);
    });

    it('records the time actually spent', async () => {
      await mount({ practice: 'grounding' });
      press('pause.ready.start');
      advance(45000);
      [5, 4, 3, 2, 1].forEach(dots => {
        press(`${dots} / ${dots}`);
        press('common.continue');
      });
      press('pause.checkin.calmer');
      press('pause.weight.skip');
      expect(mockRecord).toHaveBeenCalledWith('grounding', 45);
    });
  });

  describe('"too much to do"', () => {
    const toLoad = async () => {
      await mount({ practice: 'sigh', instant: true });
      finishSession();
      press('pause.checkin.calmer');
      press('pause.weight.load');
    };

    it('asks to pick one of today\'s open tasks, and will not go on until one is picked', async () => {
      mockTasks = [{ id: 'a', title: 'Reply to the landlord' }, { id: 'b', title: 'Book the dentist' }];
      await toLoad();
      press('pause.load.go');
      expect(has('pause.load.pickFirst')).toBe(true);
      press('Book the dentist');
      press('pause.load.go');
      expect(has('pause.end.title')).toBe(true);
      expect(has('Book the dentist')).toBe(true);
    });

    it('with no open tasks, offers to think of one and goes on', async () => {
      await toLoad();
      expect(has('pause.load.noTasks')).toBe(true);
      press('pause.load.go');
      expect(has('pause.end.title')).toBe(true);
    });
  });

  it.each(['time', 'event', 'night', 'unsure'])('shows the short path for "%s"', async weight => {
    await mount({ practice: 'sigh', instant: true });
    finishSession();
    press('pause.checkin.same');
    press(`pause.weight.${weight}`);
    expect(has(`pause.${weight}.title`)).toBe(true);
    press('common.continue');
    expect(has('pause.end.title')).toBe(true);
  });

  describe('the close', () => {
    const toClose = async () => {
      await mount({ practice: 'sigh', instant: true });
      finishSession();
      press('pause.checkin.calmer');
      press('pause.weight.skip');
    };

    it('says what was gained, and nothing more when nothing was unlocked', async () => {
      await toClose();
      expect(has('pause.end.gained')).toBe(true);
      expect(has('pause.end.levelUp')).toBe(false);
      expect(has('pause.end.milestone')).toBe(false);
      expect(has('pause.end.goal')).toBe(false);
    });

    it('says, softly, what was unlocked: a level, milestones, the daily goal', async () => {
      mockRecord.mockReturnValue(
        result({
          progress: { totalSeconds: 660, days: {}, sessions: 5, tried: [], earned: [] },
          milestones: ['first', 'five'],
          leveledUp: true,
          goalReachedNow: true,
        }),
      );
      await toClose();
      expect(has('pause.end.levelUp|{"level":"pause.level.steady"}')).toBe(true);
      expect(has('pause.end.milestone|{"name":"pause.ms.first"}')).toBe(true);
      expect(has('pause.end.milestone|{"name":"pause.ms.five"}')).toBe(true);
      expect(has('pause.end.goal')).toBe(true);
    });

    it('shows no gain for a session that did not count', async () => {
      mockRecord.mockReturnValue(result({ gainedSeconds: 0 }));
      await toClose();
      expect(has('pause.end.gained')).toBe(false);
    });

    it('records once, even if the screen re-renders', async () => {
      await toClose();
      advance(5000);
      expect(mockRecord).toHaveBeenCalledTimes(1);
    });

    it('goes back to the menu, or leaves Pause altogether', async () => {
      await toClose();
      press('pause.end.another');
      expect(mockGoBack).toHaveBeenCalledTimes(1);
      press('common.close');
      expect(mockPopToTop).toHaveBeenCalledTimes(1);
    });

    it('goes to the menu or home when there is nothing to go back to', async () => {
      mockCanGoBack = false;
      await toClose();
      press('pause.end.another');
      expect(mockNavigate).toHaveBeenCalledWith('Pause');
      press('common.close');
      expect(mockNavigate).toHaveBeenCalledWith('Home');
    });

    it('keeps a small way to find someone to talk to', async () => {
      await toClose();
      press('pause.help.footer');
      expect(openURL).toHaveBeenCalledTimes(1);
      expect(has('pause.end.private')).toBe(true);
    });
  });

  it('logs only that a pause started and that it finished, nothing about what was picked', async () => {
    mockTasks = [{ id: 'a', title: 'Reply to the landlord' }];
    await mount({ practice: 'box' });
    expect(mockLogEvent).not.toHaveBeenCalledWith('pause_completed');
    press('pause.ready.start');
    finishSession();
    press('pause.checkin.calmer');
    press('pause.weight.load');
    press('Reply to the landlord');
    press('pause.load.go');
    expect(mockLogEvent.mock.calls).toEqual([['pause_started'], ['pause_completed']]);
  });

  it('closes mid-session without recording anything, and keeps nothing running', async () => {
    await mount({ practice: 'sigh', instant: true });
    advance(5000);
    press('pause.close.a11y');
    expect(mockGoBack).toHaveBeenCalledTimes(1);
    act(() => renderer.unmount());
    expect(mockKeepAwake).toHaveBeenLastCalledWith(false);
    advance(10 * 60 * 1000);
    expect(jest.getTimerCount()).toBe(0);
    expect(mockRecord).not.toHaveBeenCalled();
    expect(mockLogEvent.mock.calls).toEqual([['pause_started']]);
  });
});
