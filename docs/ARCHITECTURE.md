# Until: Days left — App Architecture

**Feature-Based Architecture + Pragmatic Clean Architecture**, with a **Single Source of Truth (SSOT)** for every concern. The app is cut into vertical *features* (time, tasks, premium, …). Inside a feature, code is layered the clean-architecture way. Features talk to each other only through small public APIs, along a declared, acyclic dependency table.

```
src/
├── app/        composition root (di), navigation, app shell        → may use every feature
├── features/   one folder per product capability                   → may use shared + declared features
├── shared/     kernel: time math, theme, ui kit, types, platform   → uses nothing above it
├── config/     app-wide constants (pricing, trial, analytics ids)  → kernel
└── assets/     fonts, icons, images
```

---

## The three rules that keep it maintainable

1. **A feature is a module.** Everything about tasks lives in `features/tasks/`. Other code sees only `features/tasks/index.ts` (and, for pure code, `features/tasks/domain/index.ts`). Deleting or rewriting a feature touches that folder and its callers, nothing else.
2. **Dependencies point one way.** `app → features → shared`. Between features, only the edges in the table below exist, and they form a DAG. `shared/` and `config/` never import a feature or `app/`.
3. **One owner per truth.** Each fact (time and profile, access rules, progress colours, storage keys, widget cache, DTOs) is defined in exactly one module; everything else reads it from there.

All three are checked by tests, not just documented (see [Enforcement](#enforcement)).

---

## Layers inside a feature

```
features/<feature>/
├── domain/      pure TypeScript: rules, entities, ports (interfaces), use cases
├── data/        implementations of the ports: MMKV repositories, SDK adapters
├── services/    helpers screens may call directly (notifications, prompts, caches); own their storage keys
├── hooks/       React bindings: the only place a feature reaches the composition root
├── ui/          screens and components
├── config/      feature-private constants (optional)
└── index.ts     the public API
```

| Layer | Responsibility | Rule |
|-------|---------------|------|
| **ui** | Render, capture input | No `data/`, no storage, no `app/di`, no use-case classes. Take data from hooks. No pure domain logic (ADR-7) except clock/format helpers. |
| **hooks** | React state over use cases | Import use-case *instances* from `app/di`. No storage, no repositories. |
| **services** | Notifications, prompts, small caches | May own private storage keys. Never import `app/di`. |
| **domain** | What the feature can do | No React, no SDKs, no packages, no `data`/`hooks`/`services`/`ui`, no `app`. Talks to the world only through ports it declares. |
| **data** | Where data lives and which SDK is used | Implements domain ports. Wired in `app/di`. |

`shared/` (the kernel) holds what several features need and nothing feature-specific: `time` (date and progress math, clock), `theme`, `ui` (design-system components), `types` (DTOs), `persistence` (MMKV, schema), `platform` (native bridges, device id, widget-sync port), `analytics`, `navigation` (route param types and the root ref), `hooks`, `featureFlags`, `utils`, `ports`.

---

## Feature dependency table

The only feature-to-feature imports allowed (`FEATURE_DEPENDENCIES` in `__tests__/architecture.test.ts`). Read it as "needs":

| Tier | Feature | May use |
|------|---------|---------|
| 0 | `presence`, `countdowns`, `counters`, `app-update` | — |
| 1 | `time` | presence |
| 2 | `onboarding` | time |
| 3 | `account` | onboarding, time |
| 3 | `ember` | onboarding, presence, time |
| 4 | `premium` | account, time |
| 4 | `tasks` | ember |
| 5 | `activity` | premium, time |
| 5 | `badges` | countdowns, premium, presence, tasks, time |
| 5 | `engagement` | countdowns, premium, presence |
| 5 | `life` | premium, presence, time |
| 5 | `reflections` | onboarding, premium, time |
| 5 | `share` | premium, time |
| 5 | `widgets` | countdowns, counters, premium, tasks, time |
| 6 | `home` | activity, badges, countdowns, premium, presence, reflections, tasks, time |
| 6 | `settings` | account, activity, app-update, engagement, premium, time |

A feature never uses one of a higher tier. Adding an edge is an architectural decision: change the table in the test, here, and say why in the PR. If a new need would create a cycle, **invert the dependency** instead: the lower feature declares the narrow port it needs and `app/di` hands it the implementation (see `IProfileCloudSync`, `ICountdownEngagementSignals`, `IPurchasesLink`, `platform/widgetSync`).

### Public APIs

- `features/<f>/index.ts` — for screens, hooks and the app shell. Exports hooks, components, screens, and the domain symbols other code needs.
- `features/<f>/domain/index.ts` — for the **domain, data and services** layers of other features, and nothing else. It exports pure code only, so it never loads screens or hooks.
- Everything else in a feature is private. To share more, add an export on purpose.
- The composition root (`app/di`) may import any feature file, because wiring needs concrete classes.

---

## SSOT

- **Time and profile:** `features/time` — `TimeRepository` is the only place that reads and writes user/time data. Time math is `shared/time`.
- **Widget cache:** `TimeRepository.getWidgetCache()` uses the same `shared/time` functions as `getTimeState()`. `SyncWidgetUseCase` returns it; `features/widgets/data/WidgetSync` only persists and bridges to native. Other features tell widgets to refresh through the `shared/platform/widgetSync` port, never by importing `widgets`.
- **Access and premium rules:** `features/premium/domain/accessControl.ts`. Pricing and trial constants: `config/monetization.ts`, `config/accessConstants.ts`.
- **Progress colours:** `shared/theme/progressColor.ts` (`getProgressColor`). UI consumes it; no colour logic in components.
- **Types / DTOs:** `shared/types/index.ts`.
- **Storage keys:** `shared/persistence/schema.ts`, shared with the native widgets. A key is used by exactly one module (`__tests__/storageKeyOwnership.test.ts`).
- **Dependency wiring:** `app/di/`, one file per feature plus `repositories` and `wiring`.

---

## One-line summary

**UI reads from hooks, hooks read from use cases (via `app/di`), use cases read from ports, data implements the ports. Features meet only at public APIs, along a declared acyclic table. Every fact has exactly one owner.**

---

## Data flow

**Read** — `HomeScreen` (features/home/ui) → `useObserveTimeState()` (features/time/hooks) → `observeTimeStateUseCase` (from `app/di`) → `TimeRepository` → MMKV + `shared/time`.

**Write** — `SettingsScreen` → `useUpdateUserProfile()` → `UpdateUserProfileUseCase` → `TimeRepository.setUserProfile()` → MMKV, then subscribers re-run. When signed in the use case also pushes the profile through its `IProfileCloudSync` port; the hook then calls `widgetSync.syncWidgetCache()`.

**Widget sync** — `app/di/wiring.ts` calls `configureWidgetSync(...)` once, which registers the implementation behind `shared/platform/widgetSync`. Hooks and screens call `widgetSync.*`; `WidgetSync` calls `SyncWidgetUseCase`, writes MMKV and calls the native bridge.

**Cross-feature wiring** — `app/di` builds every repository and use case, in dependency order, and hands narrow functions to modules that must not import it (`configureWidgetSync`, `configureRetentionNotifications`).

---

## Enforcement

| Check | What it guards |
|-------|----------------|
| `npm run lint` (`.eslintrc.js`) | Layer rules inside features and `shared`: ui ↛ data/storage/di, domain pure, hooks ↛ storage, services ↛ di |
| `npm test` → `__tests__/architecture.test.ts` | Only `app/features/shared/config/assets` in `src/`; shared never imports features; cross-feature imports use public APIs; the dependency table, acyclic; features reach `app/` only via `app/di`; domain purity; 300-line ratchet |
| `npm test` → `__tests__/storageKeyOwnership.test.ts` | One owner per storage key |
| `npm test` → `__tests__/desktopBoundary.test.ts` | The desktop app imports only pure shared and domain code |
| `npm test` → `__tests__/compositionRoot.test.ts` | `app/di` builds every use case and wires start-up |
| `npm run lint:cycles` (madge) | No circular imports |

---

## Independence: what you can change without breaking things

| Change | Impact |
|--------|--------|
| Remove or rewrite a feature | Its folder, its row in the table, and the places listed as its dependents; nothing else |
| Remove widgets | Nothing depends on `widgets`; data features only call the `widgetSync` port |
| Swap MMKV for SQLite or cloud | Change `features/*/data` and `app/di/repositories.ts` |
| Change time formulas | `shared/time` only; the repository calls it |
| Add a surface (watchOS, desktop) | Reuse `shared/*` and `features/*/domain`; read the same MMKV keys |
| Swap analytics vendor | `shared/analytics` only |

---

## Quick reference: where does it go?

| Task | Where |
|------|-------|
| New time metric | `shared/time/*.ts`, surfaced via `features/time` |
| New use case | `features/<f>/domain/useCases/`, built in `app/di/<f>.ts`, used in a hook in `features/<f>/hooks/` |
| New screen | `features/<f>/ui/`, registered in `app/navigation/`, params in `shared/navigation/types.ts` |
| New storage key | `shared/persistence/schema.ts`, used by exactly one module |
| New reusable component | `shared/ui/` (generic) or `features/<f>/ui/` (feature-specific) |
| New feature | New folder under `features/`, a row in the dependency table, a section in `app/di/` |
| Native widget data | `shared/types/widgetDataContract.ts`, `shared/persistence/schema.ts` |

---

## Related documentation

- **FOLDER_STRUCTURE.md** — directory layout, naming, where to put new code
- **CODING_STANDARDS.md** — TypeScript, React, naming conventions
- **STATE_MANAGEMENT.md** — use cases, hooks, subscriptions, local state
- **DECISIONS.md** — Architecture Decision Records (ADR-11 onward cover the feature-based layout)
- **ARCHITECTURE_AUDIT_2026-10-16.md** — the audit and migration that produced this layout
- **WIDGETS.md** — widget implementation guide
- **DEVICE_POLICY.md** — device limit, slot rules and known gaps
- **APP_UPDATES.md** — the update bottom sheet and the release-day steps
