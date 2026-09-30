import { EvaluateBadgesUseCase } from '../src/domain/useCases/EvaluateBadgesUseCase';
import { GetBadgesUseCase } from '../src/domain/useCases/GetBadgesUseCase';
import { AcknowledgeBadgesUseCase } from '../src/domain/useCases/AcknowledgeBadgesUseCase';
import {
  EMPTY_BADGE_STATE,
  type BadgeState,
  type IBadgeRepository,
} from '../src/domain/repository/IBadgeRepository';
import { EMPTY_PRESENCE } from '../src/domain/presence/presenceStreak';
import type { DailyTask } from '../src/types';

function makeWorld() {
  let badgeState: BadgeState = { ...EMPTY_BADGE_STATE, earned: {}, seen: [] };
  const badgeRepository: IBadgeRepository = {
    getState: () => badgeState,
    setState: s => {
      badgeState = s;
    },
    subscribe: () => () => {},
  };
  const world = {
    presence: { ...EMPTY_PRESENCE },
    tasks: [] as DailyTask[],
    countdowns: [] as Array<{ id: string; title: string; date: string }>,
    goals: [] as unknown[],
    birthDate: null as string | null,
    lifeViewed: false,
    appOpens: 0,
  };
  const evaluate = new EvaluateBadgesUseCase(
    badgeRepository,
    { getState: () => world.presence, setState: () => {} },
    { getAllTasks: () => world.tasks } as never,
    { getAll: () => world.countdowns } as never,
    { getAllGoals: () => world.goals } as never,
    { getUserProfile: () => ({ birthDate: world.birthDate, deathAge: 80 }) } as never,
    {
      getLifeScreenViewed: () => world.lifeViewed,
      getAppOpenCount: () => world.appOpens,
    } as never,
  );
  return {
    world,
    badgeRepository,
    evaluate,
    getBadges: new GetBadgesUseCase(badgeRepository, evaluate),
    acknowledge: new AcknowledgeBadgesUseCase(badgeRepository),
  };
}

const task = (id: string, date: string, completed: boolean): DailyTask => ({
  id,
  date,
  title: id,
  category: 'other',
  completed,
});

describe('EvaluateBadgesUseCase', () => {
  it('awards nothing for a fresh install', () => {
    const { evaluate } = makeWorld();
    expect(evaluate.execute(new Date(2026, 9, 1))).toEqual([]);
  });

  it('awards day one once the streak starts, and stamps the local date', () => {
    const { world, evaluate, badgeRepository } = makeWorld();
    world.presence = { ...EMPTY_PRESENCE, count: 1, longest: 1 };
    expect(evaluate.execute(new Date(2026, 9, 1))).toEqual(['streak_1']);
    expect(badgeRepository.getState().earned.streak_1).toBe('2026-10-01');
  });

  it('returns a badge only the first time it is earned', () => {
    const { world, evaluate } = makeWorld();
    world.presence = { ...EMPTY_PRESENCE, count: 1, longest: 1 };
    evaluate.execute(new Date(2026, 9, 1));
    expect(evaluate.execute(new Date(2026, 9, 2))).toEqual([]);
  });

  it('keeps a badge after the user un-checks the task', () => {
    const { world, evaluate, getBadges } = makeWorld();
    world.tasks = [task('a', '2026-10-01', true)];
    expect(evaluate.execute()).toEqual(['task_1']);
    world.tasks = [task('a', '2026-10-01', false)];
    evaluate.execute();
    const first = getBadges.execute().badges.find(b => b.definition.id === 'task_1');
    expect(first?.earned).toBe(true);
    expect(first?.progress.reached).toBe(false);
  });

  it('awards several badges in one pass, in catalog order', () => {
    const { world, evaluate } = makeWorld();
    world.birthDate = '1998-04-02';
    world.lifeViewed = true;
    world.goals = [{}];
    world.countdowns = [{ id: 'c', title: 'Exam', date: '2020-01-01' }];
    expect(evaluate.execute()).toEqual([
      'life_set',
      'life_viewed',
      'deadline_set',
      'deadline_reached',
      'goal_set',
    ]);
  });

  it('does not count a future countdown as reached', () => {
    const { world, evaluate } = makeWorld();
    world.countdowns = [{ id: 'c', title: 'Trip', date: '2099-01-01' }];
    expect(evaluate.execute()).toEqual(['deadline_set']);
  });
});

describe('GetBadgesUseCase and AcknowledgeBadgesUseCase', () => {
  it('lists earned badges as new until they are marked seen', () => {
    const { world, evaluate, getBadges, acknowledge } = makeWorld();
    world.presence = { ...EMPTY_PRESENCE, count: 3, longest: 3 };
    evaluate.execute();

    const before = getBadges.execute();
    expect(before.earnedCount).toBe(2);
    expect(before.pendingUnlocks.map(b => b.definition.id)).toEqual([
      'streak_1',
      'streak_3',
    ]);

    acknowledge.markSeen(['streak_1']);
    expect(
      getBadges.execute().pendingUnlocks.map(b => b.definition.id),
    ).toEqual(['streak_3']);

    acknowledge.markSeen(['streak_3']);
    expect(getBadges.execute().pendingUnlocks).toEqual([]);
  });

  it('suggests the closest unfinished badge', () => {
    const { world, evaluate, getBadges } = makeWorld();
    world.presence = { ...EMPTY_PRESENCE, count: 6, longest: 6 };
    evaluate.execute();
    expect(getBadges.execute().upNext?.definition.id).toBe('streak_7');
  });

  it('plays the streak celebration once per day', () => {
    const { acknowledge } = makeWorld();
    expect(acknowledge.getStreakCelebratedOn()).toBeNull();
    acknowledge.markStreakCelebrated('2026-10-01');
    expect(acknowledge.getStreakCelebratedOn()).toBe('2026-10-01');
  });
});
