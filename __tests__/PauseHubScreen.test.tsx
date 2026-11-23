/**
 * The Pause menu: the panic button first, a pick that suits the hour, calm minutes and the week, every
 * practice (none locked), and milestones. Also the rules that keep the game from ever making anyone feel worse.
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { PauseHubScreen } from '../src/features/pause/ui/PauseHubScreen';
import { PRACTICES } from '../src/features/pause/domain/practices';
import { EMPTY_PROGRESS, type PauseProgress } from '../src/features/pause/domain/pauseProgress';

jest.mock('@shopify/react-native-skia', () => ({ Canvas: () => null, Path: () => null, Skia: {} }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let mockCanGoBack = true;
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack, canGoBack: () => mockCanGoBack }),
  useFocusEffect: () => {},
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

let mockHour = 9;
jest.mock('../src/shared/time/clock', () => {
  const actual = jest.requireActual('../src/shared/time/clock');
  return { ...actual, now: () => new Date(2026, 10, 25, mockHour, 0, 0) };
});

let mockProgress: PauseProgress = EMPTY_PROGRESS;
let mockTodaySeconds = 0;
jest.mock('../src/features/pause/hooks/usePauseProgress', () => ({
  usePauseProgress: () => {
    const domain = jest.requireActual('../src/features/pause/domain/pauseProgress');
    return {
      progress: mockProgress,
      todaySeconds: mockTodaySeconds,
      goalSeconds: 180,
      level: domain.levelFor(mockProgress.totalSeconds),
      week: domain.weekDays(mockProgress, '2026-11-25'),
      record: jest.fn(),
    };
  },
}));

jest.mock('../src/shared/i18n/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key}|${JSON.stringify(params)}` : key),
    formatDate: (_d: Date, o: { weekday?: string }) => (o.weekday === 'narrow' ? 'D' : 'Day'),
  }),
}));

let renderer: ReactTestRenderer.ReactTestRenderer;

function collect(node: unknown, out: string[]): string[] {
  if (node == null) return out;
  if (typeof node === 'string') out.push(node);
  else if (Array.isArray(node)) node.forEach(child => collect(child, out));
  else if (typeof node === 'object') collect((node as { children?: unknown }).children, out);
  return out;
}
const text = () => collect(renderer.toJSON(), []).join('\n');
const has = (s: string) => text().includes(s);

function press(labelStart: string) {
  const node = renderer.root.findAll(
    n => typeof n.props?.accessibilityLabel === 'string' && n.props.accessibilityLabel.startsWith(labelStart) && typeof n.props.onPress === 'function',
  )[0];
  if (!node) throw new Error(`no button starting "${labelStart}"`);
  act(() => node.props.onPress());
}

async function mount() {
  await act(async () => {
    renderer = ReactTestRenderer.create(<PauseHubScreen />);
  });
}

beforeEach(() => {
  mockNavigate.mockClear();
  mockGoBack.mockClear();
  mockCanGoBack = true;
  mockHour = 9;
  mockProgress = EMPTY_PROGRESS;
  mockTodaySeconds = 0;
});

describe('the panic button', () => {
  it('is on the menu, and starts quick calm at once', async () => {
    await mount();
    expect(has('pause.hub.quick.title')).toBe(true);
    expect(has('pause.hub.quick.body')).toBe(true);
    press('pause.hub.quick.title');
    expect(mockNavigate).toHaveBeenCalledWith('PauseSession', { practice: 'sigh', instant: true });
  });

  it('comes before anything else that can be pressed', async () => {
    await mount();
    const labels = renderer.root
      .findAll(n => typeof n.props?.accessibilityLabel === 'string' && typeof n.props.onPress === 'function')
      .map(n => n.props.accessibilityLabel as string);
    const quick = labels.findIndex(l => l.startsWith('pause.hub.quick.title'));
    const firstPractice = labels.findIndex(l => l.startsWith('pause.practice.'));
    expect(quick).toBeGreaterThan(-1);
    expect(quick).toBeLessThan(firstPractice);
  });
});

describe('the greeting and the pick for now', () => {
  it.each([
    [8, 'pause.hub.greeting.morning', 'coherent'],
    [14, 'pause.hub.greeting.afternoon', 'box'],
    [19, 'pause.hub.greeting.evening', 'extended'],
    [23, 'pause.hub.greeting.night', 'wind'],
  ])('at %i o\'clock greets with %s and suggests %s', async (hour, greeting, practice) => {
    mockHour = hour;
    await mount();
    expect(has(greeting)).toBe(true);
    expect(has('pause.hub.forNow')).toBe(true);
    // The suggested practice shows twice: once as the pick, once in the full list.
    expect(renderer.root.findAll(n => n.props?.accessibilityLabel?.startsWith?.(`pause.practice.${practice}.name`) && typeof n.props.onPress === 'function')).toHaveLength(2);
  });

  it('opens the pick as a chosen practice, with the "ready" step', async () => {
    mockHour = 14;
    await mount();
    const [featured] = renderer.root.findAll(n => n.props?.accessibilityLabel?.startsWith?.('pause.practice.box.name') && typeof n.props.onPress === 'function');
    act(() => featured.props.onPress());
    expect(mockNavigate).toHaveBeenCalledWith('PauseSession', { practice: 'box', instant: false });
  });
});

describe('all practices', () => {
  it('lists every one, with its evidence, and none is locked', async () => {
    await mount();
    PRACTICES.forEach(p => {
      expect(has(`pause.practice.${p.id}.name`)).toBe(true);
      expect(has(`pause.evidence.${p.evidence}`)).toBe(true);
    });
  });

  it.each(PRACTICES.map(p => p.id))('opens %s even for someone who has done nothing yet', async id => {
    await mount();
    const all = renderer.root.findAll(n => n.props?.accessibilityLabel?.startsWith?.(`pause.practice.${id}.name`) && typeof n.props.onPress === 'function');
    act(() => all[all.length - 1].props.onPress());
    expect(mockNavigate).toHaveBeenCalledWith('PauseSession', { practice: id, instant: false });
  });
});

describe('your calm', () => {
  it('shows today against the goal, the level, and the days of the week', async () => {
    mockTodaySeconds = 125;
    await mount();
    expect(has('pause.hub.todayValue|{"minutes":2,"goal":3}')).toBe(true);
    expect(has('pause.level.settling')).toBe(true);
    expect(has('pause.hub.nextLevel|{"minutes":10,"level":"pause.level.steady"}')).toBe(true);
    expect(text().match(/^D$/gm)).toHaveLength(7);
  });

  it('says plainly that there are no streaks and nothing is lost by missing a day', async () => {
    await mount();
    expect(has('pause.hub.reassure')).toBe(true);
    expect(has('streak')).toBe(false);
  });

  it('shows the top level without a next step', async () => {
    mockProgress = { ...EMPTY_PROGRESS, totalSeconds: 150 * 60 + 5 };
    await mount();
    expect(has('pause.level.tranquil')).toBe(true);
    expect(has('pause.hub.topLevel')).toBe(true);
    expect(has('pause.hub.nextLevel')).toBe(false);
  });
});

describe('milestones', () => {
  it('shows all six, none earned at first', async () => {
    await mount();
    ['first', 'five', 'ten', 'explorer', 'week', 'night'].forEach(id => expect(has(`pause.ms.${id}`)).toBe(true));
    const labelled = renderer.root.findAll(n => typeof n.type === 'string' && n.props?.accessible === true && n.props.accessibilityLabel?.includes?.('pause.ms.locked'));
    expect(labelled).toHaveLength(6);
  });

  it('tells earned from not yet, for screen readers too', async () => {
    mockProgress = { ...EMPTY_PROGRESS, earned: ['first', 'night'] };
    await mount();
    const earned = renderer.root.findAll(n => typeof n.type === 'string' && n.props?.accessible === true && n.props.accessibilityLabel?.includes?.('pause.ms.earned'));
    expect(earned).toHaveLength(2);
    const locked = renderer.root.findAll(n => typeof n.type === 'string' && n.props?.accessible === true && n.props.accessibilityLabel?.includes?.('pause.ms.locked'));
    expect(locked).toHaveLength(4);
  });
});

describe('closing', () => {
  it('goes back, or home when there is nothing to go back to', async () => {
    await mount();
    press('pause.close.a11y');
    expect(mockGoBack).toHaveBeenCalledTimes(1);
    mockCanGoBack = false;
    press('pause.close.a11y');
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });
});
