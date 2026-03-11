# UNTIL — Architecture Decision Records

Key architectural decisions and their rationale for scalability and maintainability.

---

## ADR-1: Clean Architecture with SSOT

**Status:** Accepted

**Context:** Need a scalable structure where business logic is testable, swappable, and independent of UI and storage.

**Decision:** Use clean architecture with explicit layers:
- **Core** — Pure logic (no React, no I/O)
- **Domain** — Ports (interfaces) and use cases
- **Infrastructure** — Repository implementations, MMKV, native bridges
- **Surfaces** — Screens; only call use cases via hooks

Single Source of Truth for each concern:
- Time/profile: `TimeRepository`
- Progress colors: `theme/progressColor.ts`
- Types: `types/index.ts`
- Storage keys: `persistence/schema.ts`

**Consequences:** Clear boundaries; easy to swap persistence or add new surfaces (e.g. watchOS) without touching core.

---

## ADR-2: Composition Root (di.ts)

**Status:** Accepted

**Context:** Need a single place to wire implementations to use cases.

**Decision:** All repository instantiation and use case wiring in `src/di.ts`. App code imports use cases from `di`; never instantiates repositories directly.

**Consequences:** Easy to swap implementations (e.g. MMKV → SQLite) by changing only `di.ts` and infrastructure.

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

**Decision:** Use `react-native-mmkv` for all persisted data. Keys in `persistence/schema.ts`; shared with Swift/Kotlin widget code.

**Consequences:** Fast reads; widgets can read without JS bridge. Migration via `migration.ts` when schema changes.

---

## ADR-5: Widget Data via Same Repository Logic

**Status:** Accepted

**Context:** Widgets need time progress; must not duplicate time logic.

**Decision:** `TimeRepository.getWidgetCache()` uses same `core/time` functions as `getTimeState()`. `SyncWidgetUseCase` returns that cache; `WidgetSync` persists and bridges to native.

**Consequences:** One source of truth for time calculations; widgets always consistent with app.

---

## ADR-6: Progress Color SSOT

**Status:** Accepted

**Context:** "Green → orange → red" scale used in multiple places.

**Decision:** Define once in `theme/progressColor.ts` as `getProgressColor(progress: number)`. UI consumes; no duplicate color logic in components.

**Consequences:** Consistent visual language; single place to change scale.

---

## ADR-7: Surfaces Do Not Import Core/Persistence

**Status:** Accepted

**Context:** Prevent accidental coupling and make layer boundaries enforceable.

**Decision:** Surfaces (screens) never import from `core` or `persistence` for business data. Exception: `getDayProgress`, `startOfDay`, etc. for **display formatting** when `timeState` doesn't provide the exact format (prefer deriving from `timeState` when possible).

**Consequences:** Clear dependency direction; easier refactors.

---

## ADR-8: Native Widgets Read MMKV Directly

**Status:** Accepted

**Context:** Widgets run in separate process; cannot call JS.

**Decision:** Widgets (Swift/Kotlin) read from same MMKV keys as app. `WidgetSync` writes JSON to MMKV on app launch and when app becomes active.

**Consequences:** Widgets work when app is closed; no bridge dependency for reads.

---

## Adding New ADRs

When making a significant architectural decision:

1. Add a new section with `ADR-N: Title`
2. Include: Status, Context, Decision, Consequences
3. Keep entries concise (5–10 lines each)
