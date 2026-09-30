import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import {
  BADGES,
  EMPTY_BADGE_SNAPSHOT,
  getBadgeProgress,
} from '../src/domain/badges/badgeCatalog';
import { buildDailyQuests } from '../src/domain/badges/dailyQuests';
import type { BadgeView } from '../src/domain/useCases/GetBadgesUseCase';
import { BadgeMedal, ConfettiBurst, ProgressRing, StreakFlame } from '../src/ui';
import {
  BadgeShelf,
  BadgeUnlockHost,
  BadgeUnlockOverlay,
  DailyQuestsCard,
  StreakChip,
} from '../src/components/gamification';
import { setEmberModalCoveringSource } from '../src/services/emberSurface';

// ui/index pulls in Skia grids; none of them are rendered here.
jest.mock('@shopify/react-native-skia', () => ({
  Canvas: () => null,
  Path: () => null,
  Skia: {},
}));

const mockOverview = {
  pendingUnlocks: [] as BadgeView[],
  earnedCount: 0,
  total: 17,
  markSeen: jest.fn(),
  refresh: jest.fn(),
};
jest.mock('../src/hooks', () => ({
  useBadgeOverview: () => mockOverview,
}));
jest.mock('../src/navigation/rootNavigationRef', () => ({
  rootNavigationRef: { addListener: jest.fn(() => () => {}) },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

function view(
  id: string,
  patch: Partial<BadgeView> & { value?: number } = {},
): BadgeView {
  const definition = BADGES.find(b => b.id === id)!;
  const progress = getBadgeProgress(definition, {
    ...EMPTY_BADGE_SNAPSHOT,
    [definition.metric]: patch.value ?? 0,
  });
  return {
    definition,
    progress,
    earned: progress.reached,
    earnedOn: progress.reached ? '2026-10-01' : null,
    isNew: false,
    ...patch,
  };
}

type Json = ReactTestRenderer.ReactTestRendererJSON;

/** All visible text, in order, with split JSX children joined back together. */
function textOf(tree: ReactTestRenderer.ReactTestRenderer): string {
  const walk = (node: Json | string | null): string => {
    if (node == null) return '';
    if (typeof node === 'string') return node;
    return (node.children ?? []).map(walk).join('');
  };
  const root = tree.toJSON();
  if (Array.isArray(root)) return root.map(walk).join(' ');
  return walk(root);
}

/** Tappable elements (Pressable renders as a composite with onPress). */
function pressables(tree: ReactTestRenderer.ReactTestRenderer) {
  return tree.root.findAll(
    n =>
      typeof n.type !== 'string' &&
      typeof n.props.onPress === 'function' &&
      n.props.accessibilityRole === 'button',
  );
}

async function render(element: React.ReactElement) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(element);
  });
  return tree;
}

const trees: ReactTestRenderer.ReactTestRenderer[] = [];
async function mount(element: React.ReactElement) {
  const tree = await render(element);
  trees.push(tree);
  return tree;
}

afterEach(async () => {
  await ReactTestRenderer.act(async () => {
    trees.splice(0).forEach(t => t.unmount());
  });
});

describe('BadgeMedal', () => {
  it('draws every glyph and tier, locked and open', async () => {
    const seen = new Set<string>();
    for (const b of BADGES) {
      for (const locked of [false, true]) {
        const key = `${b.glyph}-${b.tier}-${locked}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const tree = await mount(
          <BadgeMedal
            glyph={b.glyph}
            tier={b.tier}
            locked={locked}
            progress={locked ? 0.4 : undefined}
            shine="once"
            enter="pop"
          />,
        );
        expect(tree.toJSON()).not.toBeNull();
      }
    }
    expect(seen.size).toBeGreaterThan(10);
  });
});

describe('animated primitives', () => {
  it('renders the ring, flame and confetti', async () => {
    const ring = await mount(
      <ProgressRing progress={0.5}>
        <></>
      </ProgressRing>,
    );
    const flame = await mount(<StreakFlame burstKey={3} />);
    const confetti = await mount(
      <ConfettiBurst burstKey="a" colors={['#fff', '#f90']} count={10} />,
    );
    expect(ring.toJSON()).not.toBeNull();
    expect(flame.toJSON()).not.toBeNull();
    expect(confetti.toJSON()).not.toBeNull();
  });

  it('keeps confetti quiet until it is given a key', async () => {
    const tree = await mount(
      <ConfettiBurst burstKey={null} colors={['#fff']} />,
    );
    expect(tree.toJSON()).toBeNull();
  });
});

describe('DailyQuestsCard', () => {
  it('shows progress and sends the user to their tasks', async () => {
    const onQuestPress = jest.fn();
    const tree = await mount(
      <DailyQuestsCard
        quests={buildDailyQuests({
          noticedToday: true,
          tasksTotal: 4,
          tasksCompleted: 1,
        })}
        onQuestPress={onQuestPress}
      />,
    );
    const out = textOf(tree);
    expect(out).toContain('2 of 3 done');
    expect(out).toContain('1/4');

    // Only the unfinished quest is tappable.
    const rows = pressables(tree);
    expect(rows.length).toBe(1);
    await ReactTestRenderer.act(async () => {
      rows[0].props.onPress();
    });
    expect(onQuestPress).toHaveBeenCalledWith('finish');
  });

  it('lets an empty day jump straight to adding a task', async () => {
    const onQuestPress = jest.fn();
    const tree = await mount(
      <DailyQuestsCard
        quests={buildDailyQuests({
          noticedToday: true,
          tasksTotal: 0,
          tasksCompleted: 0,
        })}
        onQuestPress={onQuestPress}
      />,
    );
    expect(textOf(tree)).toContain('Add a task');
    const rows = pressables(tree);
    expect(rows.length).toBe(2);
    await ReactTestRenderer.act(async () => {
      rows[0].props.onPress();
    });
    expect(onQuestPress).toHaveBeenCalledWith('plan');
  });

  it('says so when the day is finished', async () => {
    const tree = await mount(
      <DailyQuestsCard
        quests={buildDailyQuests({
          noticedToday: true,
          tasksTotal: 2,
          tasksCompleted: 2,
        })}
        onQuestPress={jest.fn()}
      />,
    );
    expect(textOf(tree)).toContain('All done for today.');
  });
});

describe('BadgeShelf', () => {
  it('lists earned badges first and the count', async () => {
    const badges = [
      view('streak_1', { value: 1 }),
      view('task_10', { value: 4 }),
      view('streak_7', { value: 3 }),
    ];
    const onOpen = jest.fn();
    const tree = await mount(
      <BadgeShelf
        overview={{
          badges,
          earnedCount: 1,
          total: BADGES.length,
          upNext: badges[1],
        }}
        onOpen={onOpen}
      />,
    );
    const out = textOf(tree);
    expect(out).toContain(`1 of ${BADGES.length}`);
    expect(out).toContain('Day one');
    expect(out).toContain('Up next: Ten down');
    expect(out.indexOf('Day one')).toBeLessThan(out.indexOf('Ten down'));

    await ReactTestRenderer.act(async () => {
      pressables(tree)[0].props.onPress();
    });
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

describe('BadgeUnlockOverlay', () => {
  it('renders nothing without a badge', async () => {
    const tree = await mount(
      <BadgeUnlockOverlay
        badge={null}
        mode="unlock"
        earnedCount={0}
        total={BADGES.length}
        onClose={jest.fn()}
      />,
    );
    expect(tree.toJSON()).toBeNull();
  });

  it('announces a new badge and closes from the button', async () => {
    const onClose = jest.fn();
    const tree = await mount(
      <BadgeUnlockOverlay
        badge={view('streak_7', { value: 7, isNew: true })}
        mode="unlock"
        remaining={0}
        earnedCount={3}
        total={BADGES.length}
        onClose={onClose}
      />,
    );
    const out = textOf(tree);
    expect(out).toContain('New badge');
    expect(out).toContain('One full week');
    expect(out).toContain('Nice');

    const button = pressables(tree).find(
      p => p.props.accessibilityLabel === 'Close' && p.props.style,
    );
    expect(button).toBeDefined();
    await ReactTestRenderer.act(async () => {
      button!.props.onPress();
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('offers the next badge when more are waiting', async () => {
    const tree = await mount(
      <BadgeUnlockOverlay
        badge={view('task_1', { value: 1, isNew: true })}
        mode="unlock"
        remaining={2}
        earnedCount={1}
        total={BADGES.length}
        onClose={jest.fn()}
      />,
    );
    expect(textOf(tree)).toContain('Next (2 more)');
  });

  it('shows progress for a locked badge in detail mode', async () => {
    const tree = await mount(
      <BadgeUnlockOverlay
        badge={view('streak_7', { value: 5 })}
        mode="detail"
        earnedCount={0}
        total={BADGES.length}
        onClose={jest.fn()}
      />,
    );
    const out = textOf(tree);
    expect(out).toContain('5 of 7 days');
    expect(out).not.toContain('New badge');
  });
});

describe('StreakChip', () => {
  it('reports the streak for screen readers', async () => {
    const tree = await mount(
      <StreakChip
        count={4}
        lit
        celebrate={false}
        onCelebrated={jest.fn()}
        onPress={jest.fn()}
      />,
    );
    const chip = pressables(tree)[0];
    expect(chip.props.accessibilityLabel).toContain('4 day streak');
  });
});

describe('BadgeUnlockHost', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockOverview.markSeen.mockClear();
    mockOverview.pendingUnlocks = [view('task_1', { value: 1, isNew: true })];
    mockOverview.earnedCount = 1;
  });

  afterEach(() => {
    setEmberModalCoveringSource('test', false);
    jest.useRealTimers();
  });

  async function advance(ms: number) {
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(ms);
    });
  }

  it('waits a beat before showing the badge', async () => {
    const tree = await mount(<BadgeUnlockHost suppressed={false} />);
    expect(tree.toJSON()).toBeNull();
    await advance(1000);
    expect(textOf(tree)).toContain('First one done');
  });

  it('stays hidden while an app modal is open, then shows after it closes', async () => {
    const tree = await mount(<BadgeUnlockHost suppressed />);
    await advance(3000);
    expect(tree.toJSON()).toBeNull();

    await ReactTestRenderer.act(async () => {
      tree.update(<BadgeUnlockHost suppressed={false} />);
    });
    expect(tree.toJSON()).toBeNull();
    await advance(1000);
    expect(textOf(tree)).toContain('First one done');
  });

  it('stays hidden while a native modal covers the screen', async () => {
    await ReactTestRenderer.act(async () => {
      setEmberModalCoveringSource('test', true);
    });
    const tree = await mount(<BadgeUnlockHost suppressed={false} />);
    await advance(3000);
    expect(tree.toJSON()).toBeNull();

    await ReactTestRenderer.act(async () => {
      setEmberModalCoveringSource('test', false);
    });
    await advance(1000);
    expect(textOf(tree)).toContain('First one done');
  });

  it('marks the badge seen when it is closed', async () => {
    const tree = await mount(<BadgeUnlockHost suppressed={false} />);
    await advance(1000);
    const button = pressables(tree).find(
      p => p.props.accessibilityLabel === 'Close' && p.props.style,
    );
    await ReactTestRenderer.act(async () => {
      button!.props.onPress();
    });
    expect(mockOverview.markSeen).toHaveBeenCalledWith(['task_1']);
  });

  it('shows nothing when no badge is waiting', async () => {
    mockOverview.pendingUnlocks = [];
    const tree = await mount(<BadgeUnlockHost suppressed={false} />);
    await advance(2000);
    expect(tree.toJSON()).toBeNull();
  });
});
