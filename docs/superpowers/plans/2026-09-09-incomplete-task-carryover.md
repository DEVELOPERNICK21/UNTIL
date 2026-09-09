# Incomplete Task Carryover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Spec:** `docs/superpowers/specs/2026-09-09-incomplete-task-carryover-design.md`

**Goal:** Let users move unfinished daily tasks to tomorrow or a future date (or remove them), with a last-hour bulk banner and a next-day carryover prompt for yesterday’s leftovers.

**Architecture:** Move-in-place via `ITaskRepository.moveTask` (same id, new `date`). Pure helpers for last-hour / tomorrow / goal-duplicate skip. Use cases + `useDailyTasks` mutators. Shared `TaskMoveSheet` on `DailyTasksScreen` for single, bulk, and carryover.

**Tech Stack:** React Native, MMKV tasks, `@react-native-community/datetimepicker`, Jest, existing `todayIso` / `formatDateToIso` local day keys

## Global Constraints

- Day keys: local `YYYY-MM-DD` via `formatDateToIso` / `todayIso` — never `toISOString().slice(0, 10)`
- Surfaces: hooks / `ui` / theme / types / navigation only (no direct `core` for business logic except existing display/time helpers if already used)
- Human-copy: no em dashes, no coach filler; use copy table from the spec
- Date picker minimum: always **tomorrow** local; carryover **Today** is a dedicated button only
- Goal-sourced duplicate on target day (`sourceGoalId` + `sourceGoalTaskId`): skip / no-op
- After move/remove: call `syncDailyTasksWidget()`
- Completed tasks: no Move action

## File map

| File | Responsibility |
|------|----------------|
| `src/domain/tasks/taskMove.ts` | Pure: tomorrow ISO, last-hour check, goal-duplicate skip, apply move to in-memory list |
| `__tests__/taskMove.test.ts` | Unit tests for pure helpers |
| `src/domain/repository/ITaskRepository.ts` | Add `moveTask` |
| `src/infrastructure/repositories/MmkvTaskRepository.ts` | Implement `moveTask` |
| `src/domain/useCases/MoveTaskUseCase.ts` | Single move + skip duplicate |
| `src/domain/useCases/MoveTasksUseCase.ts` | Bulk move |
| `__tests__/moveTaskUseCases.test.ts` | Fake repo tests |
| `src/persistence/schema.ts` | `TASK_CARRYOVER_DISMISSED_DATE` key |
| `src/di.ts` | Wire move use cases |
| `src/hooks/useDailyTasks.ts` | `moveTask`, `moveTasks`, `removeTasks` |
| `src/components/tasks/TaskMoveSheet.tsx` | Tomorrow + pick date modal |
| `src/surfaces/app/DailyTasksScreen.tsx` | Row Move, last-hour banner, carryover sheet |

---

### Task 1: Pure task-move helpers

**Files:**
- Create: `src/domain/tasks/taskMove.ts`
- Test: `__tests__/taskMove.test.ts`

**Interfaces:**
- Produces:
  - `addDaysIso(dateIso: string, days: number): string`
  - `isLastHourOfDay(now: Date): boolean` — true when `msUntilNextMidnight(now) < 60 * 60 * 1000`
  - `shouldSkipMoveForGoalDuplicate(task: DailyTask, targetDayTasks: DailyTask[]): boolean`
  - `applyMoveTask(all: DailyTask[], id: string, newDate: string): DailyTask[]` — no-op if missing, same date, or goal duplicate; else update date + order to `max(order on newDate)+1`

- [ ] **Step 1: Write the failing test**

```typescript
import {
  addDaysIso,
  applyMoveTask,
  isLastHourOfDay,
  shouldSkipMoveForGoalDuplicate,
} from '../src/domain/tasks/taskMove';
import type { DailyTask } from '../src/types';

function task(partial: Partial<DailyTask> & Pick<DailyTask, 'id' | 'date'>): DailyTask {
  return {
    title: 'T',
    category: 'other',
    completed: false,
    ...partial,
  };
}

describe('taskMove', () => {
  it('addDaysIso adds calendar days in local time', () => {
    expect(addDaysIso('2026-09-09', 1)).toBe('2026-09-10');
  });

  it('isLastHourOfDay is true after 23:00 local', () => {
    expect(isLastHourOfDay(new Date(2026, 8, 9, 23, 15, 0))).toBe(true);
    expect(isLastHourOfDay(new Date(2026, 8, 9, 22, 0, 0))).toBe(false);
  });

  it('skips move when target already has same goal task', () => {
    const moving = task({
      id: 'a',
      date: '2026-09-09',
      sourceGoalId: 'g1',
      sourceGoalTaskId: 'gt1',
    });
    const target = [
      task({
        id: 'b',
        date: '2026-09-10',
        sourceGoalId: 'g1',
        sourceGoalTaskId: 'gt1',
      }),
    ];
    expect(shouldSkipMoveForGoalDuplicate(moving, target)).toBe(true);
  });

  it('applyMoveTask updates date and appends order', () => {
    const all = [
      task({ id: 'a', date: '2026-09-09', order: 1 }),
      task({ id: 'b', date: '2026-09-10', order: 2 }),
    ];
    const next = applyMoveTask(all, 'a', '2026-09-10');
    const moved = next.find(t => t.id === 'a')!;
    expect(moved.date).toBe('2026-09-10');
    expect(moved.order).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=taskMove --watchman=false`  
Expected: FAIL (module not found or exports missing)

- [ ] **Step 3: Implement `src/domain/tasks/taskMove.ts`**

```typescript
import type { DailyTask } from '../../types';
import { formatDateToIso, parseDate } from '../../core/time/clock';
import { msUntilNextMidnight } from '../../core/time/projections';

export function addDaysIso(dateIso: string, days: number): string {
  const d = parseDate(dateIso);
  d.setDate(d.getDate() + days);
  return formatDateToIso(d);
}

export function isLastHourOfDay(now: Date = new Date()): boolean {
  return msUntilNextMidnight(now) < 60 * 60 * 1000;
}

export function shouldSkipMoveForGoalDuplicate(
  task: DailyTask,
  targetDayTasks: DailyTask[],
): boolean {
  if (task.sourceGoalId == null || task.sourceGoalTaskId == null) return false;
  return targetDayTasks.some(
    t =>
      t.id !== task.id &&
      t.sourceGoalId === task.sourceGoalId &&
      t.sourceGoalTaskId === task.sourceGoalTaskId,
  );
}

export function applyMoveTask(
  all: DailyTask[],
  id: string,
  newDate: string,
): DailyTask[] {
  const idx = all.findIndex(t => t.id === id);
  if (idx === -1) return all;
  const task = all[idx];
  if (task.date === newDate) return all;
  const targetDay = all.filter(t => t.date === newDate);
  if (shouldSkipMoveForGoalDuplicate(task, targetDay)) return all;
  const maxOrder = targetDay.reduce((m, t) => Math.max(m, t.order ?? 0), 0);
  const next = all.slice();
  next[idx] = { ...task, date: newDate, order: maxOrder + 1 };
  return next;
}
```

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/domain/tasks/taskMove.ts __tests__/taskMove.test.ts
git commit -m "feat(tasks): add pure helpers for move and last-hour check"
```

---

### Task 2: Repository `moveTask`

**Files:**
- Modify: `src/domain/repository/ITaskRepository.ts`
- Modify: `src/infrastructure/repositories/MmkvTaskRepository.ts`

**Interfaces:**
- Consumes: `applyMoveTask` from `src/domain/tasks/taskMove.ts`
- Produces: `ITaskRepository.moveTask(id: string, date: string): void`

- [ ] **Step 1: Extend interface**

```typescript
moveTask(id: string, date: string): void;
```

- [ ] **Step 2: Implement on `MmkvTaskRepository`**

```typescript
moveTask(id: string, date: string): void {
  const all = loadAllTasks();
  const next = applyMoveTask(all, id, date);
  if (next === all) return; // reference equality if applyMoveTask returns same array on no-op
  saveAllTasks(next);
  this.notifySubscribers();
}
```

Note: `applyMoveTask` must return the **same array reference** on no-op (already does). On change it returns a new array.

- [ ] **Step 3: Commit**

```bash
git add src/domain/repository/ITaskRepository.ts src/infrastructure/repositories/MmkvTaskRepository.ts
git commit -m "feat(tasks): persist moveTask on daily task repository"
```

---

### Task 3: Move use cases + fake-repo tests

**Files:**
- Create: `src/domain/useCases/MoveTaskUseCase.ts`
- Create: `src/domain/useCases/MoveTasksUseCase.ts`
- Test: `__tests__/moveTaskUseCases.test.ts`

**Interfaces:**
- Consumes: `ITaskRepository.moveTask`, `getTasksForDay`
- Produces:
  - `MoveTaskUseCase.execute(id: string, date: string): void`
  - `MoveTasksUseCase.execute(ids: string[], date: string): void` — calls `moveTask` per id (repo already skips duplicates)

- [ ] **Step 1: Write failing use-case tests with an in-memory fake**

```typescript
import type { ITaskRepository } from '../src/domain/repository/ITaskRepository';
import type { DailyTask } from '../src/types';
import { applyMoveTask } from '../src/domain/tasks/taskMove';
import { MoveTaskUseCase } from '../src/domain/useCases/MoveTaskUseCase';
import { MoveTasksUseCase } from '../src/domain/useCases/MoveTasksUseCase';

class FakeTaskRepo implements ITaskRepository {
  tasks: DailyTask[] = [];
  getTasksForDay(date: string) {
    return this.tasks.filter(t => t.date === date);
  }
  addTask() {
    throw new Error('unused');
  }
  updateTask() {}
  toggleTask() {}
  removeTask(id: string) {
    this.tasks = this.tasks.filter(t => t.id !== id);
  }
  moveTask(id: string, date: string) {
    this.tasks = applyMoveTask(this.tasks, id, date);
  }
  subscribe() {
    return () => {};
  }
}

describe('MoveTaskUseCase', () => {
  it('moves a task to the target date', () => {
    const repo = new FakeTaskRepo();
    repo.tasks = [
      {
        id: '1',
        date: '2026-09-09',
        title: 'A',
        category: 'other',
        completed: false,
        order: 1,
      },
    ];
    new MoveTaskUseCase(repo).execute('1', '2026-09-10');
    expect(repo.tasks[0].date).toBe('2026-09-10');
  });
});

describe('MoveTasksUseCase', () => {
  it('moves many and skips goal duplicates', () => {
    const repo = new FakeTaskRepo();
    repo.tasks = [
      {
        id: '1',
        date: '2026-09-09',
        title: 'A',
        category: 'other',
        completed: false,
        sourceGoalId: 'g',
        sourceGoalTaskId: 't',
      },
      {
        id: '2',
        date: '2026-09-09',
        title: 'B',
        category: 'other',
        completed: false,
      },
      {
        id: '3',
        date: '2026-09-10',
        title: 'A',
        category: 'other',
        completed: false,
        sourceGoalId: 'g',
        sourceGoalTaskId: 't',
      },
    ];
    new MoveTasksUseCase(repo).execute(['1', '2'], '2026-09-10');
    expect(repo.tasks.find(t => t.id === '1')!.date).toBe('2026-09-09'); // skipped
    expect(repo.tasks.find(t => t.id === '2')!.date).toBe('2026-09-10');
  });
});
```

- [ ] **Step 2: Run — expect FAIL (use cases missing)**

- [ ] **Step 3: Implement use cases**

```typescript
// MoveTaskUseCase.ts
export class MoveTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}
  execute(id: string, date: string): void {
    this.taskRepository.moveTask(id, date);
  }
}

// MoveTasksUseCase.ts
export class MoveTasksUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}
  execute(ids: string[], date: string): void {
    for (const id of ids) {
      this.taskRepository.moveTask(id, date);
    }
  }
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/domain/useCases/MoveTaskUseCase.ts src/domain/useCases/MoveTasksUseCase.ts __tests__/moveTaskUseCases.test.ts
git commit -m "feat(tasks): add MoveTask and MoveTasks use cases"
```

---

### Task 4: Wire DI, storage key, and hook mutators

**Files:**
- Modify: `src/persistence/schema.ts` — add `TASK_CARRYOVER_DISMISSED_DATE: 'tasks.carryoverDismissedDate'`
- Modify: `src/di.ts` — import + export `moveTaskUseCase`, `moveTasksUseCase`
- Modify: `src/hooks/useDailyTasks.ts`

**Interfaces:**
- Consumes: move use cases, `removeTaskUseCase`
- Produces from `useDailyTasks`:
  - `moveTask(id: string, date: string): void`
  - `moveTasks(ids: string[], date: string): void`
  - `removeTasks(ids: string[]): void` — loop `removeTaskUseCase.execute`

- [ ] **Step 1: Add storage key** under Daily tasks section in `STORAGE_KEYS`

- [ ] **Step 2: Wire in `di.ts` next to other task use cases**

```typescript
export const moveTaskUseCase = new MoveTaskUseCase(taskRepository);
export const moveTasksUseCase = new MoveTasksUseCase(taskRepository);
```

- [ ] **Step 3: Extend `useDailyTasks`**

```typescript
const moveTask = useCallback(
  (id: string, targetDate: string) => {
    moveTaskUseCase.execute(id, targetDate);
    refresh();
  },
  [refresh],
);

const moveTasks = useCallback(
  (ids: string[], targetDate: string) => {
    moveTasksUseCase.execute(ids, targetDate);
    refresh();
  },
  [refresh],
);

const removeTasks = useCallback(
  (ids: string[]) => {
    for (const id of ids) removeTaskUseCase.execute(id);
    refresh();
  },
  [refresh],
);
```

Return them alongside existing mutators. Import use cases from `../di`.

- [ ] **Step 4: Commit**

```bash
git add src/persistence/schema.ts src/di.ts src/hooks/useDailyTasks.ts
git commit -m "feat(tasks): wire move/remove bulk into di and useDailyTasks"
```

---

### Task 5: `TaskMoveSheet` UI

**Files:**
- Create: `src/components/tasks/TaskMoveSheet.tsx`

**Interfaces:**
- Consumes: `formatDateToIso`, `addDaysIso`, `todayIso` from core clock / domain taskMove; `DateTimePicker`; `Text` / `Card` patterns from UI
- Produces:

```typescript
type TaskMoveSheetProps = {
  visible: boolean;
  title: string; // "Move task" | "Move N tasks"
  /** When true, show a Today button (carryover only). */
  showTodayOption?: boolean;
  onClose: () => void;
  onSelectDate: (dateIso: string) => void;
};
```

- Tomorrow = `addDaysIso(todayIso(), 1)`
- Today option = `todayIso()` when `showTodayOption`
- Pick a date: toggle `DateTimePicker` with `minimumDate` = local tomorrow midnight (`parseDate(addDaysIso(todayIso(), 1))`)
- On Android/iOS follow `IdentitySetupScreen` picker pattern (`display="spinner"`, dismiss on change)

- [ ] **Step 1: Implement sheet as Modal + buttons matching existing DailyTasks edit modal styles (reuse Spacing/Colors/Radius)**

Copy labels exactly: `Tomorrow`, `Pick a date`, and `Today` when enabled. No other CTAs in the sheet (caller handles Clear / Not now outside).

- [ ] **Step 2: Manual smoke in simulator not required in this task; typecheck by importing from DailyTasks in next task**

- [ ] **Step 3: Commit**

```bash
git add src/components/tasks/TaskMoveSheet.tsx
git commit -m "feat(tasks): add TaskMoveSheet with Tomorrow and date picker"
```

---

### Task 6: Per-row Move on DailyTasksScreen

**Files:**
- Modify: `src/surfaces/app/DailyTasksScreen.tsx`

**Interfaces:**
- Consumes: `useDailyTasks().moveTask`, `TaskMoveSheet`, `addDaysIso`, `todayIso`, `useWidgetSyncActions().syncDailyTasksWidget`

- [ ] **Step 1: Extend `TaskRow` props**

- Add `onMove?: () => void`
- For `!task.completed`, show a **Move** control next to Edit (caption style like Edit)
- Do not show Move when `task.completed`

- [ ] **Step 2: Screen state for single move**

```typescript
const [moveTargetIds, setMoveTargetIds] = useState<string[] | null>(null);
const [moveSheetTitle, setMoveSheetTitle] = useState('Move task');
const [moveShowToday, setMoveShowToday] = useState(false);
```

Open: `setMoveTargetIds([task.id]); setMoveSheetTitle('Move task'); setMoveShowToday(false);`

On select date:

```typescript
moveTasks(moveTargetIds, dateIso);
syncDailyTasksWidget();
setMoveTargetIds(null);
```

- [ ] **Step 3: Render `TaskMoveSheet` when `moveTargetIds != null`**

- [ ] **Step 4: Commit**

```bash
git add src/surfaces/app/DailyTasksScreen.tsx
git commit -m "feat(tasks): add Move action on unfinished daily tasks"
```

---

### Task 7: Last-hour bulk banner

**Files:**
- Modify: `src/surfaces/app/DailyTasksScreen.tsx`

**Interfaces:**
- Consumes: `isLastHourOfDay`, unfinished = `tasks.filter(t => !t.completed)`, `moveTasks`, `removeTasks`

- [ ] **Step 1: Derive**

```typescript
const unfinished = tasks.filter(t => !t.completed);
const showLastHourBanner = isLastHourOfDay() && unfinished.length > 0;
```

Recompute on focus / AppState via existing `useTodayIso` re-renders; optionally tick once per minute with `setInterval` while focused if needed so banner appears at 23:00 without leaving the screen — prefer a 30s–60s interval while screen focused.

- [ ] **Step 2: Banner UI above the list (or under report card)**

- Text: `` `${unfinished.length} tasks still open` `` (use `1 task` vs `N tasks` if you want grammar; spec allows `N tasks still open`)
- Buttons:
  - **Move all to tomorrow** → `moveTasks(ids, addDaysIso(today, 1)); sync…`
  - **Choose date** → open `TaskMoveSheet` with all unfinished ids, title `Move N tasks`
  - **Clear unfinished** → `Alert.alert('Remove N unfinished tasks?', …)` then `removeTasks(ids); sync…`

- [ ] **Step 3: Commit**

```bash
git add src/surfaces/app/DailyTasksScreen.tsx
git commit -m "feat(tasks): last-hour banner for unfinished bulk move/clear"
```

---

### Task 8: Next-day carryover prompt

**Files:**
- Modify: `src/surfaces/app/DailyTasksScreen.tsx`
- Uses: `STORAGE_KEYS.TASK_CARRYOVER_DISMISSED_DATE`, `getString` / `setString` from persistence — **prefer a tiny helper in the hook or a use case** so the surface does not import `persistence` directly.

**Preferred boundary (architecture):**
- Create `src/hooks/useTaskCarryoverPrompt.ts` that:
  - On focus: `yesterday = addDaysIso(today, -1)`
  - Loads unfinished via `getTasksForDayUseCase.execute(yesterday).filter(t => !t.completed)`
  - Reads dismiss key via getString; if `dismissed === yesterday` or unfinished empty → no prompt
  - Exposes `{ visible, unfinishedYesterday, dismissNotNow, clearYesterday, /* open move handled by parent */ }`
  - `dismissNotNow` sets `TASK_CARRYOVER_DISMISSED_DATE` to yesterday ISO

**OR** put get/set on a small use case `GetTaskCarryoverPromptUseCase` / `DismissTaskCarryoverUseCase` if you want stricter layering. Hook wrapping MMKV get/set for this one key is acceptable if kept out of the surface.

- [ ] **Step 1: Implement hook (or use cases + hook) as above**

- [ ] **Step 2: On DailyTasksScreen focus, if prompt visible show Modal**

Actions:
- **Today** → `moveTasks(ids, today); sync; close`
- **Tomorrow** → `moveTasks(ids, addDaysIso(today,1)); sync; close`
- **Pick a date** → open `TaskMoveSheet` with `showTodayOption={false}`, then close carryover
- **Clear them** → confirm → `removeTasks(ids); sync; close`
- **Not now** → `dismissNotNow(); close`

- [ ] **Step 3: Manual checklist**

1. Add unfinished task; set device time to 23:15 → banner shows  
2. Move all to tomorrow → list empties; tomorrow has tasks  
3. Single row Move → Pick a date  
4. Leave unfinished; advance to next calendar day → carryover sheet  
5. Not now → reopen screen → no sheet; new unfinished yesterday later can prompt again  

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useTaskCarryoverPrompt.ts src/hooks/index.ts src/surfaces/app/DailyTasksScreen.tsx
git commit -m "feat(tasks): next-day carryover prompt for unfinished tasks"
```

---

### Task 9: Plan/spec verification commit (docs only if needed)

- [ ] Confirm all spec behaviors have a task (coverage list below)
- [ ] Run: `npm test -- --testPathPattern='taskMove|moveTaskUseCases|todayIsoLocal' --watchman=false`
- [ ] Expected: all PASS

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Per-task Move + Remove | 6 (Remove already exists) |
| Tomorrow + Pick a date | 5, 6 |
| Move-in-place same id | 1–3 |
| Last-hour banner bulk | 7 |
| Next-day carryover + Not now | 8 |
| Goal duplicate skip | 1, 3 |
| Local day keys | Global + existing todayIso fix |
| Widget sync after mutate | 6–8 |
| Clear unfinished confirm copy | 7, 8 |
| Date picker min = tomorrow | 5 |
| Carryover Today button only | 5 `showTodayOption`, 8 |

## Self-review notes

- No TBD placeholders in steps.
- `applyMoveTask` is the single place for duplicate skip + order; repo and tests share it.
- Surfaces avoid persistence via `useTaskCarryoverPrompt` (Task 8).
- Fake repo in Task 3 must implement full `ITaskRepository` including new `moveTask`.
