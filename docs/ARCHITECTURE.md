# Until: Days left — App Architecture

A **clean architecture** with **Single Source of Truth (SSOT)** for a time-progress app. Data flows in one direction; layers are independent and swappable.

---

## Clean architecture & SSOT

- **Core** (`core/time`, `core/activity`): Pure logic only. No React, no storage, no I/O. **SSOT for time and activity rules.**
- **Domain**: Repository interfaces (ports) and use cases. Use cases orchestrate; they do not perform I/O themselves (except via repositories). **SSOT for what the app can do.**
- **Infrastructure**: Repository implementations, persistence, native bridges. **SSOT for where data lives** (MMKV, schema keys).
- **Surfaces / UI**: Only call use cases (via `di`) and render. No direct imports from `core` or `persistence` for business data.
- **Composition root** (`di.ts`): Single place that wires implementations to use cases. All app code uses use cases from `di`.

**Widget cache SSOT:** Widget data is produced by `TimeRepository.getWidgetCache()` (same time logic as `getTimeState()`). `SyncWidgetUseCase` returns that cache; `WidgetSync` only persists and bridges to native. The `WidgetCache` type lives in `types`; `surfaces/widgets/dataContract` re-exports for widget code.

**Progress color SSOT:** The scale “green → orange → red” for “where you are” in time is defined once in `theme/progressColor.ts` as pure `getProgressColor(progress: number)`. UI only consumes it; no duplicate color logic in components.

---

## One-Line Summary

**"UI reads from use cases, use cases read from repositories, TimeRepository is SSOT for time/profile and widget cache, repositories use core + MMKV. Widgets read the same MMKV. No one else touches storage."**

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        UI LAYER                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ HomeScreen  │  │SettingsScreen│ │  Widgets (Swift/Kotlin) │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
└─────────┼────────────────┼──────────────────────┼───────────────┘
          │                │                      │
          │  useObserveTimeState()                │  reads directly
          │  useUpdateUserProfile()               │
          ▼                ▼                      │
┌─────────────────────────────────────────────────┼───────────────┐
│                 USE CASE LAYER                  │               │
│  ┌────────────────────────┐ ┌─-───────────────┐ │               │
│  │ObserveTimeStateUseCase │ │UpdateUserProfile│ │               │
│  └───────────┬────────────┘ └─-───────┬───────┘ │               │
└──────────────┼────────────────────────┼─────────┼───────────────┘
               │                        │         │
               └────────────────────────┼─────────┘
                                        ▼
┌─────────────────────────────────────────────────────────────────┐
│            SINGLE SOURCE OF TRUTH (SSOT)                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    TimeRepository                           ││
│  │  getUserProfile() | getTimeState() | getWidgetCache() | set  ││
│  └─────────────────────────────┬───────────────────────────────┘│
└────────────────────────────────┼────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  MMKV (persistence)     core/time (pure logic)              ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow (Step by Step)

### Reading Time Progress (Home Screen)

1. **HomeScreen** calls `useObserveTimeState()`
2. Hook subscribes to **TimeRepository** and polls every 60s
3. **TimeRepository** reads user profile from MMKV, calls **core/time** to compute progress
4. Hook returns `{ userProfile, timeState }` to the screen
5. Screen renders ProgressBars

### Updating Profile (Settings Screen)

1. **SettingsScreen** calls `useUpdateUserProfile()` and `useObserveTimeState()`
2. User taps Save → `updateUserProfile(birthDate, deathAge)` runs
3. **UpdateUserProfileUseCase** calls **TimeRepository.setUserProfile()**
4. **TimeRepository** writes to MMKV and notifies subscribers
5. **useObserveTimeState** subscribers re-run → UI re-renders with new data

### Widget sync (SSOT)

1. **syncWidgetCache()** (infrastructure) is called on app launch and when app becomes active
2. It calls **SyncWidgetUseCase.execute()**, which returns **TimeRepository.getWidgetCache()**
3. **getWidgetCache()** uses the same **core/time** functions as **getTimeState()** — no duplicated time logic
4. WidgetSync then writes JSON to MMKV and (iOS/Android) notifies native widgets
5. **Widgets** (iOS Swift / Android Kotlin) read from the same MMKV keys; keys in `persistence/schema.ts`

---

## Folder Structure and File Descriptions

```
src/
│
├── app.tsx                    # Root: migrations, Redux Provider, navigation
│
├── core/                      # DOMAIN: Pure business logic (no React, no storage)
│   └── time/
│       ├── clock.ts           # now(), startOfDay(), parseDate(), daysInMonth()
│       ├── day.ts             # getDayProgress()
│       ├── month.ts           # getMonthProgress()
│       ├── year.ts            # getYearProgress()
│       ├── life.ts            # getLifeProgress()
│       └── projections.ts     # projectLifeProgressTimestamp(), msUntilNextMidnight()
│
├── di.ts                      # Composition root: wire repos → use cases (single place)
│
├── domain/                    # Ports and use cases (no I/O, no storage details)
│   ├── repository/            # Interfaces (ITimeRepository, IActivityRepository, …)
│   └── useCases/
│       ├── ObserveTimeStateUseCase.ts   # observe() + subscribe()
│       ├── UpdateUserProfileUseCase.ts  # execute(birthDate, deathAge)
│       ├── SyncWidgetUseCase.ts         # execute() → WidgetCache from TimeRepository
│       └── …
│
├── persistence/               # DATA: Storage layer
│   ├── mmkv.ts                # MMKV instance, getString/setString/etc
│   ├── schema.ts              # STORAGE_KEYS, DEFAULTS (shared with widgets)
│   └── migration.ts           # runMigrations() for version upgrades
│
├── hooks/                     # React bindings to use cases
│   ├── useObserveTimeState.ts # Subscribes to TimeRepository, returns { userProfile, timeState }
│   ├── useUpdateUserProfile.ts# Returns updateUserProfile(birthDate, deathAge)
│   ├── useAppDispatch.ts      # Typed Redux dispatch (for premium)
│   └── useAppSelector.ts      # Typed Redux selector (for premium)
│
├── surfaces/                  # UI: Screens and render targets
│   ├── app/
│   │   ├── HomeScreen.tsx     # Displays day/month/year/life progress
│   │   └── SettingsScreen.tsx # Birth date, death age inputs
│   ├── widgets/dataContract.ts # Shared types for native widgets
│   ├── island/dataShape.ts    # Live Activity / Dynamic Island data shape
│   └── overlay/               # Lock screen (placeholder)
│
├── ui/                        # Reusable presentational components
│   ├── Text.tsx               # Text with variant (title, subtitle, body, caption)
│   ├── ProgressBar.tsx        # progress 0-1, height, color
│   └── DotsGrid.tsx           # rows x cols grid of dots
│
├── redux/                     # Runtime state (premium only)
│   ├── store.ts               # Root store
│   ├── slices/premium.slice.ts
│   └── middleware/mmkvSync.ts
│
├── platform/                  # Native bridges (widgets, Live Activity)
│   ├── ios/bridge.ts
│   └── android/bridge.ts
│
├── navigation/
│   └── RootNavigator.tsx      # Stack: Home, Settings
│
├── theme/                     # Colors, spacing, typography
├── types/                     # UserProfile, TimeProgress, WidgetCache, … (SSOT for DTOs)
├── utils/                     # Generic helpers (no time logic)
└── assets/                    # Fonts, icons, images
```

---

## Layer Responsibilities

| Layer                 | Responsibility                   | Rule                                        |
| --------------------- | -------------------------------- | ------------------------------------------- |
| **UI** (surfaces, ui) | Display data, capture user input | No business logic, no direct storage access |
| **Use cases**         | Orchestrate reads/writes         | Call repository, no storage details         |
| **TimeRepository**    | Single source of truth           | Only place that writes user/time to MMKV; only place that builds WidgetCache from core/time |
| **Core**              | Pure time calculations           | No React, no storage, no side effects       |
| **Persistence**       | MMKV access, schema, migrations  | No business logic                           |
| **Platform**          | Native modules, widget bridges   | Platform-specific code only                 |

---

## Independence: What You Can Change Without Breaking Things

| Change                           | Impact                                     |
| -------------------------------- | ------------------------------------------ |
| Remove a screen                  | No change to repository or use cases       |
| Remove widgets                   | No change; they read MMKV directly         |
| Swap MMKV for SQLite or cloud    | Change only TimeRepository internals       |
| Change time formulas             | Change only core/time; repository calls it |
| Add a new surface (e.g. watchOS) | Reuse TimeRepository; read same MMKV keys  |

---

## Quick Reference: Key Files by Task

| Task                              | Files                                                        |
| --------------------------------- | ------------------------------------------------------------ |
| Add a new time metric             | `core/time/*.ts`                                             |
| Change storage keys               | `persistence/schema.ts`                                      |
| Change what screens display       | `surfaces/app/*.tsx`                                         |
| Change persistence implementation | `persistence/mmkv.ts`, `domain/repository/TimeRepository.ts` |
| Add a use case                    | `domain/useCases/*.ts`, `hooks/*.ts`                         |
| Add a reusable component          | `ui/*.tsx`                                                   |
| Native widget data                | `surfaces/widgets/dataContract.ts`, `persistence/schema.ts`  |
