/**
 * Today's three quests (pure). Built from data the app already has, so there
 * is nothing extra to store and nothing to cheat: un-checking a task lowers the
 * ring again.
 */

import { t } from '../../../shared/i18n/translate';

export type QuestId = 'checkin' | 'plan' | 'finish';

export interface DailyQuest {
  id: QuestId;
  label: string;
  /** Short progress text, e.g. "2/5". Empty when a count makes no sense. */
  detail: string;
  /** 0 to 1. */
  ratio: number;
  done: boolean;
}

export interface DailyQuestsInput {
  noticedToday: boolean;
  tasksTotal: number;
  tasksCompleted: number;
}

export interface DailyQuests {
  quests: DailyQuest[];
  /** Mean of the quest ratios, 0 to 1. Drives the ring. */
  ratio: number;
  doneCount: number;
  allDone: boolean;
}

/** `translate` lets a screen pass its own `t`, so the labels follow the language it renders in. */
export function buildDailyQuests(
  input: DailyQuestsInput,
  translate: typeof t = t,
): DailyQuests {
  const total = Math.max(0, input.tasksTotal);
  const completed = Math.min(total, Math.max(0, input.tasksCompleted));

  const checkin: DailyQuest = {
    id: 'checkin',
    label: translate('badges.quests.checkin'),
    detail: '',
    ratio: input.noticedToday ? 1 : 0,
    done: input.noticedToday,
  };

  const plan: DailyQuest = {
    id: 'plan',
    label: translate('badges.quests.plan'),
    detail:
      total > 0
        ? translate('badges.quests.tasks', { count: total })
        : translate('badges.quests.addTask'),
    ratio: total > 0 ? 1 : 0,
    done: total > 0,
  };

  const finishDone = total > 0 && completed === total;
  const finish: DailyQuest = {
    id: 'finish',
    label: translate('badges.quests.finish'),
    detail: total > 0 ? `${completed}/${total}` : '',
    ratio: total > 0 ? completed / total : 0,
    done: finishDone,
  };

  const quests = [checkin, plan, finish];
  const ratio = quests.reduce((sum, q) => sum + q.ratio, 0) / quests.length;
  const doneCount = quests.filter(q => q.done).length;
  return { quests, ratio, doneCount, allDone: doneCount === quests.length };
}
