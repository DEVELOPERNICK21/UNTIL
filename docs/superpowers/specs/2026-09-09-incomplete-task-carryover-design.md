# Incomplete task move / carryover

**Date:** 2026-09-09  
**Status:** Approved for planning  
**Approach:** Move-in-place (same task id, update `date`)

## Problem

Unfinished daily tasks stick on the day they were created. After local midnight (and especially with the earlier UTC day-key bug), users need a clear way to move or remove them. They also want a fast path to tomorrow and a nudge late in the day / next morning.

## Goals

- Always let users **Move** or **Remove** unfinished tasks.
- Quick **Tomorrow** plus **Pick a date** (future dates).
- Stronger nudge in the **last hour** of the local day (bulk actions).
- On **first open next day**, offer to handle yesterday’s unfinished (bring forward, pick date, clear, or dismiss).
- No duplicate goal-sourced tasks on the target day.

## Non-goals

- Soft “deferred” flags or history of prior dates.
- Copy-then-delete (new ids).
- Auto-move without a prompt.
- Moving completed tasks.

## Behavior

### Per unfinished task (any time)

- Row actions for incomplete tasks: **Move**, **Remove** (keep existing Edit where already present).
- Completed tasks: no Move.
- **Move** opens `TaskMoveSheet`:
  - **Tomorrow** (one tap)
  - **Pick a date** via `@react-native-community/datetimepicker`, future only
- Move updates `date` on the same task; stays incomplete; `order` appended to the end of the target day’s list.
- Remove confirms, then deletes.

### Last hour (11:00 PM–midnight local)

- On `DailyTasksScreen`, if unfinished count ≥ 1, show a banner:
  - Copy: `N tasks still open`
  - Actions: **Move all to tomorrow** · **Choose date** · **Clear unfinished**
- Banner does not block the rest of the screen.
- Window: local time where hours remaining in the day is less than 1 (same local clock as day progress / `todayIso`).

### Next day carryover

- When focusing Today’s tasks, if **yesterday** still has unfinished tasks and that yesterday ISO has not been dismissed:
  - Sheet once: bring to **Today** · **Tomorrow** · **Pick a date** · **Clear them** · **Not now**
- **Not now** persists `taskCarryoverDismissedDate = <yesterday ISO>` so we do not re-prompt for that yesterday until a newer unfinished “yesterday” appears.
- Empty unfinished → no sheet.

### Goal / repeat-daily

- On move (single or bulk): if target day already has a task with the same `sourceGoalId` + `sourceGoalTaskId`, **skip** that task.
- Single move that would duplicate: no-op for that task; optional short note (e.g. already on that day).

## Architecture

### Data layer

- `ITaskRepository.moveTask(id: string, date: string): void`
- `MmkvTaskRepository`: update `date`, reassign `order` to end of that day’s tasks; notify subscribers.
- Day keys always local `YYYY-MM-DD` via `todayIso` / `formatDateToIso` (not UTC `toISOString().slice`).

### Use cases

- `MoveTaskUseCase` — one id → date (with goal-duplicate skip).
- `MoveTasksUseCase` — many ids → date (skip duplicates; move the rest).
- Reuse `RemoveTaskUseCase` for remove / clear unfinished.
- Helper as needed: incomplete tasks for a date (filter `!completed` from `getTasksForDay`).

### Composition

- Wire new use cases in `di.ts`; expose via `useDailyTasks` (`moveTask`, `moveTasks`, bulk remove helper if useful).

### UI

- `TaskMoveSheet` — shared for single and bulk (title: `Move task` / `Move N tasks`).
- Last-hour banner on `DailyTasksScreen`.
- Carryover modal on focus when yesterday has pending and not dismissed.
- After any move/remove: existing `syncDailyTasksWidget()`.

### Persistence (carryover dismiss)

- Storage key e.g. `taskCarryoverDismissedDate` (string ISO date), via existing MMKV schema / persistence helpers.

## Copy

| Surface | Text |
|--------|------|
| Banner | `N tasks still open` |
| Move sheet | `Move task` / `Move N tasks` |
| Buttons | `Tomorrow` · `Pick a date` · `Clear unfinished` · `Not now` · `Today` (carryover) |
| Clear confirm | `Remove N unfinished tasks?` · `Cancel` / `Remove` |

Follow human-copy rules: short, concrete; no coach filler or em dashes.

## Edge cases

- Target date equals current task date → no-op.
- Date picker minimum is always **tomorrow** (local). Carryover “bring to today” is only via the dedicated **Today** button, not the picker.
- Clear unfinished: only incomplete; completed remain.
- App across midnight: `useTodayIso` refreshes; carryover may show on next focus.
- Bulk clear / move with zero unfinished: hide controls.

## Testing

- Unit: `moveTask` updates date + order; bulk skips duplicate goal tasks; last-hour window uses local clock.
- Manual: single → tomorrow; pick later date; last-hour banner; next-day carryover + Not now; widget refresh after move.

## Out of scope follow-ups

- Viewing / editing arbitrary past days’ task lists in the UI (beyond carryover sourcing yesterday).
- Analytics events for move/carryover (can add later if needed).
