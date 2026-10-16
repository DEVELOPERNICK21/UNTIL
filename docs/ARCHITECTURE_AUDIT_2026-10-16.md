# Architecture audit, 2026-10-16

Goal: Feature-Based Architecture + Pragmatic Clean Architecture, SSOT and dependency control, with no behaviour change. Branch `refactor/feature-architecture`.

## What the audit found

- Layer-first layout: 429 files, 1,768 imports, 34 files over 300 lines, one 578-line `di.ts`. Layer rules were linted, but nothing stopped feature-to-feature coupling.
- Hidden cycles between features: account <-> premium, time <-> widgets, countdowns <-> engagement, badges -> engagement.
- Kernel-looking folders imported features (`theme` -> Ember insights, `ui` -> badges and account).
- Duplication: 30 hand-written day/hour products, four copies of `randomId`, zero-arg `new Date()` in domain code, a UTC day key in the countdown repository.
- The ESLint config would have stopped working silently after a move (it listed folders by name).

## What changed

1. **Structure.** `src/app`, `src/features/<19 features>/{domain,data,services,hooks,ui}`, `src/shared`. 16 barrels flattened, every import rewritten by codemod, a public `index.ts` per feature plus a pure `domain/index.ts`.
2. **Cycles removed by inversion**, not by moving code around: `IProfileCloudSync`, `ICountdownEngagementSignals`, `IPurchasesLink`, the `shared/platform/widgetSync` port; presence, ember and the device-id port extracted.
3. **Composition root** split into 19 sections under `app/di`.
4. **Enforcement.** ESLint layer rules ported; `__tests__/architecture.test.ts` (public APIs, dependency table, acyclic, domain purity, file-size ratchet); `ssot.test.ts`; `compositionRoot.test.ts`; desktop boundary test made strict (no package reaches the web build).
5. **SSOT.** `shared/time/constants.ts`, the clock for domain and data, `shared/utils/randomId`, countdown day keys now local (was UTC).
6. **Docs.** ARCHITECTURE, FOLDER_STRUCTURE, DECISIONS (ADR-11 to 15), CODING_STANDARDS and the Cursor rules rewritten.
7. **Lint.** 15 pre-existing errors down to 5 (the Ember hook dependency warnings, left because fixing them changes behaviour).

## Verified

tsc (only the 6 errors that existed before), 62 Jest suites / 397 tests, madge (no cycles), ESLint, desktop type-check and build, iOS and Android Metro bundles (1,979 modules vs 1,944 before; the extra are the new index and di files), the composition root loaded end to end under Jest. Not verified: a run on a device or simulator (the installed simulator build is RN 0.83, the repo is 0.86) and the Windows desktop build.

## Left on purpose

34 files are still over 300 lines (the screens, `WidgetSync`, `FirebaseAuthServiceAdapter`, `shared/ui/Ember`); the ratchet stops growth. Splitting them is the next maintainability step. Five Ember hook-dependency lint errors remain.
