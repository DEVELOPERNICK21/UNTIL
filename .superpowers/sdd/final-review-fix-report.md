# Incomplete task carryover review fixes

## Status

Critical and Important whole-branch findings are fixed.

## Fixes

- Added `GetStoredTasksForDayUseCase` and switched the carryover prompt to it, so reading yesterday never materializes repeat-daily goal tasks.
- Made bulk moves return the number of tasks actually moved.
- Marked carryover move choices as handled, including duplicate-only no-ops, and added an already-on-target-day alert.
- Added an Android `InteractionManager.runAfterInteractions` path for opening `TaskMoveSheet` after the carryover modal closes. iOS continues to use `Modal.onDismiss`.
- Added a 60-second refresh inside `useTodayIso` so a focused task screen changes day after local midnight.
- Fixed test repository and renderer typing issues.
- Pluralized one-task banner, move, and clear copy.
- Added negative-day and same-reference no-op coverage.

## Verification

`npm test -- --watchman=false --testPathPattern='taskMove|moveTaskUseCases|todayIsoLocal|taskMoveCarryover'`

- 4 test suites passed
- 12 tests passed
- 0 snapshots

`npx tsc --noEmit --pretty false` has no diagnostics in the changed carryover files. The command remains non-zero because of unrelated existing errors in premium, HomeScreen, WidgetCustomizationScreen, Slider, and website files.
