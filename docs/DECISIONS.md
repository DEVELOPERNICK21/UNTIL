# UNTIL — Architecture Decision Records

Key architectural decisions and their rationale for scalability and maintainability.

---

## ADR-1: Clean Architecture with SSOT

**Status:** Accepted

**Context:** Need a scalable structure where business logic is testable, swappable, and independent of UI and storage.

**Decision:** Use clean architecture with explicit layers. Since ADR-11 the layers live *inside each feature*:
- **domain** — Pure logic, ports (interfaces) and use cases (no React, no I/O)
- **data** — Port implementations, MMKV, SDK adapters
- **hooks / ui** — React bindings and screens; only call use cases via hooks

Single Source of Truth for each concern:
- Time/profile: `TimeRepository` (`features/time`)
- Progress colors: `shared/theme/progressColor.ts`
- Types: `shared/types/index.ts`
- Storage keys: `shared/persistence/schema.ts`

**Consequences:** Clear boundaries; easy to swap persistence or add new surfaces (e.g. watchOS) without touching the domain.

---

## ADR-2: Composition Root (di.ts)

**Status:** Accepted

**Context:** Need a single place to wire implementations to use cases.

**Decision:** All repository instantiation and use case wiring in `src/app/di/` (one file per feature, see ADR-14). App code imports use cases from `app/di`; never instantiates repositories directly.

**Consequences:** Easy to swap implementations (e.g. MMKV → SQLite) by changing only `app/di` and the feature's `data/`.

---

## ADR-3: Use Case + Hook Pattern (No Redux for Core)

**Status:** Accepted

**Context:** Need reactive UI for time, tasks, counters without over-engineering.

**Decision:** Use cases expose `observe()` and `subscribe()`. Hooks subscribe, hold React state, return data. No Redux for core business data.

**Consequences:** Simpler mental model; less boilerplate. Redux reserved for premium/subscription if needed later.

---

## ADR-4: MMKV for Persistence

**Status:** Accepted

**Context:** Need fast, synchronous storage for widgets (native reads same data) and app.

**Decision:** Use `react-native-mmkv` for all persisted data. Keys in `shared/persistence/schema.ts`; shared with Swift/Kotlin widget code.

**Consequences:** Fast reads; widgets can read without JS bridge. Migration via `migration.ts` when schema changes.

---

## ADR-5: Widget Data via Same Repository Logic

**Status:** Accepted

**Context:** Widgets need time progress; must not duplicate time logic.

**Decision:** `TimeRepository.getWidgetCache()` uses same `shared/time` functions as `getTimeState()`. `SyncWidgetUseCase` returns that cache; `WidgetSync` persists and bridges to native.

**Consequences:** One source of truth for time calculations; widgets always consistent with app.

---

## ADR-6: Progress Color SSOT

**Status:** Accepted

**Context:** "Green → orange → red" scale used in multiple places.

**Decision:** Define once in `shared/theme/progressColor.ts` as `getProgressColor(progress: number)`. UI consumes; no duplicate color logic in components.

**Consequences:** Consistent visual language; single place to change scale.

---

## ADR-7: Surfaces Do Not Import Core/Persistence

**Status:** Accepted

**Context:** Prevent accidental coupling and make layer boundaries enforceable.

**Decision:** Screens (`features/*/ui`) never import pure domain logic (what used to be `core/`: `shared/time/*`, `domain/aggregate`, `domain/ageGate`, …) or `shared/persistence` for business data. Exception: `shared/time/clock` (`getDayProgress`, `startOfDay`, etc.) and `shared/time/homeFormatters` for **display formatting** when `timeState` doesn't provide the exact format (prefer deriving from `timeState` when possible). The list of such modules is `CORE_MODULES` in `.eslintrc.js`.

**Consequences:** Clear dependency direction; easier refactors.

---

## ADR-8: Native Widgets Read MMKV Directly

**Status:** Accepted

**Context:** Widgets run in separate process; cannot call JS.

**Decision:** Widgets (Swift/Kotlin) read from same MMKV keys as app. `WidgetSync` writes JSON to MMKV on app launch and when app becomes active.

**Consequences:** Widgets work when app is closed; no bridge dependency for reads.

---

## ADR-9: One Owner per Storage Key (Pragmatic SSOT)

**Status:** Accepted (2026-09-28)

**Context:** Small local flags (paywall cooldown, Ember tip cursor, notification bookkeeping) live in each feature's `services/`. Wrapping each flag in port + repository + use case + hook adds ~35 files of ceremony without improving correctness.

**Decision:** Services and stores may read/write storage keys they own. A key may be used by only one module; data owned elsewhere is read through that owner (use case or injected source). Enforced by `__tests__/storageKeyOwnership.test.ts`.

**Consequences:** SSOT holds per key with little boilerplate. Cross-module data (profile, trial start, presence, widget accent) goes through repositories.

---

## ADR-10: Layer Boundaries Are Linted

**Status:** Accepted (2026-09-28)

**Context:** Rules lived only in docs and drifted (41 violations found in audit).

**Decision:** `.eslintrc.js` encodes the layer table as `@typescript-eslint/no-restricted-imports` errors (type-only imports of domain DTOs allowed). `lint:cycles` (madge) guards against import cycles.

**Consequences:** New violations fail lint. Exceptions (ADR-7 `shared/time/clock`, `shared/time/homeFormatters`) are explicit in config. ADR-15 moves feature-level rules into a test.

---

## ADR-11: Feature-Based Architecture on top of Clean Architecture

**Status:** Accepted (2026-10-16)

**Context:** The layer-first layout (`core`, `domain`, `infrastructure`, `hooks`, `surfaces`, `services`, one 578-line `di.ts`, flat barrels) had no feature boundaries: 1,768 imports, any file could import any other, `shared`-looking folders imported features, and a change to one capability touched six top-level folders. Feature cycles (account ↔ premium, time ↔ widgets, countdowns ↔ engagement) were invisible.

**Decision:** Cut `src/` into `app/` (composition root, navigation, shell), `features/<name>/` (one product capability, with `domain/ data/ services/ hooks/ ui/` inside) and `shared/` (kernel that knows no feature). The clean-architecture layer rules of ADR-1, 7 and 10 apply inside every feature. 19 features: time, presence, tasks, countdowns, counters, activity, badges, reflections, onboarding, account, premium, engagement, ember, widgets, life, home, settings, share, app-update.

**Consequences:** A feature can be understood, tested, rewritten or removed on its own. The move was done by codemod with no behaviour change (type-check, tests, desktop build and both Metro bundles match the baseline).

---

## ADR-12: Features Meet Only at Public APIs, Along a Declared Acyclic Table

**Status:** Accepted (2026-10-16)

**Context:** Folders alone do not stop coupling; deep imports across features recreate the tangle.

**Decision:** Another feature may import only `features/<f>/index.ts`, or, from its domain, data or services layers, `features/<f>/domain/index.ts` (pure, never loads screens or hooks). Which features may depend on which is the `FEATURE_DEPENDENCIES` table in `__tests__/architecture.test.ts` (mirrored in `ARCHITECTURE.md`); it must stay a DAG. `shared/` and `config/` never import a feature or `app/`. When a new need would create a cycle, invert it: the lower feature declares the narrow port it needs and `app/di` supplies the implementation (`IProfileCloudSync`, `ICountdownEngagementSignals`, `IPurchasesLink`, `shared/platform/widgetSync`).

**Consequences:** Dependency changes become visible in review (a table edit). Tests mock another feature at its public API. Public APIs are generated from real usage and grow only on purpose.

---

## ADR-13: Hooks Reach the Composition Root; Nothing Else Does

**Status:** Accepted (2026-10-16)

**Context:** Hooks need use-case instances. Per-feature containers would force every cross-feature wiring decision (analytics callbacks, premium refresh, widget sync) into the features themselves.

**Decision:** The only import from a feature into `app/` is `app/di`, and ESLint limits it to `hooks/` (UI, domain, data and services may not import it). Route param types and the root navigation ref live in `shared/navigation` so features never import `app/navigation`. The app shell (`AppEngagementLayer`) lives in `app/`, because it composes features.

**Consequences:** One sanctioned upward edge, easy to find and to replace later by React context if wanted. Importing a feature's index loads `app/di`, so tests of screens mock the feature APIs they use.

---

## ADR-14: The Composition Root Is One File per Feature

**Status:** Accepted (2026-10-16)

**Context:** `di.ts` had grown to 578 lines wiring 130 instances; every feature edit conflicted in one file.

**Decision:** `app/di/` holds `repositories.ts` (leaf adapters), `callbacks.ts`, one section per feature, and `wiring.ts` (start-up configuration of modules that must not import di). `app/di/index.ts` re-exports the same names as before. Sections import each other along the feature table, never in a cycle. `__tests__/compositionRoot.test.ts` loads the whole root with native modules stubbed.

**Consequences:** Adding a use case touches one small file. Section order is explicit.

---

## ADR-15: Architecture Is a Test, Not Only Documentation

**Status:** Accepted (2026-10-16)

**Context:** ESLint globs cannot express "features meet only at public APIs, along this table, without cycles".

**Decision:** `__tests__/architecture.test.ts` resolves every import under `src/` and fails on: stray top-level folders, shared/config importing features or app, deep cross-feature imports, edges missing from the table, cycles, features reaching `app/` other than `app/di`, impure domain, and files over 300 lines that are new or grew (`LEGACY_OVERSIZE` can only shrink). ESLint keeps the intra-feature layer rules for fast editor feedback.

**Consequences:** `npm test` is the architecture gate. Changing a rule means changing the test and these docs together.

---

## Adding New ADRs

When making a significant architectural decision:

1. Add a new section with `ADR-N: Title`
2. Include: Status, Context, Decision, Consequences
3. Keep entries concise (5–10 lines each)
