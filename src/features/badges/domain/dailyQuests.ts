/**
 * Today's three quests (pure). Built from data the app already has, so there
 * is nothing extra to store and nothing to cheat: un-checking a task lowers the
 * ring again.
 */

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

export function buildDailyQuests(input: DailyQuestsInput): DailyQuests {
  const total = Math.max(0, input.tasksTotal);
  const completed = Math.min(total, Math.max(0, input.tasksCompleted));

  const checkin: DailyQuest = {
    id: 'checkin',
    label: 'Open UNTIL',
    detail: '',
    ratio: input.noticedToday ? 1 : 0,
    done: input.noticedToday,
  };

  const plan: DailyQuest = {
    id: 'plan',
    label: 'Plan your day',
    detail: total > 0 ? `${total} ${total === 1 ? 'task' : 'tasks'}` : 'Add a task',
    ratio: total > 0 ? 1 : 0,
    done: total > 0,
  };

  const finishDone = total > 0 && completed === total;
  const finish: DailyQuest = {
    id: 'finish',
    label: 'Finish your tasks',
    detail: total > 0 ? `${completed}/${total}` : '',
    ratio: total > 0 ? completed / total : 0,
    done: finishDone,
  };

  const quests = [checkin, plan, finish];
  const ratio = quests.reduce((sum, q) => sum + q.ratio, 0) / quests.length;
  const doneCount = quests.filter(q => q.done).length;
  return { quests, ratio, doneCount, allDone: doneCount === quests.length };
}
