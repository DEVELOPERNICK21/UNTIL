# UNTIL — Folder Structure & Architecture (Refactor Handoff)

This document describes the full folder structure and architecture so an architect can plan refactoring. It extends `FOLDER_STRUCTURE.md` and aligns with `.cursor/rules/architecture.mdc` and `docs/DECISIONS.md`.

---

## 1. Root Layout

```
UNTIL/
├── src/                    # React Native app source (main codebase)
├── android/                # Android native (Kotlin, layouts, manifests, widgets)
├── ios/                    # iOS native (Swift, Xcode, widgets, Live Activity)
├── website/                # Marketing website (Next.js) — separate app
├── docs/                    # Project documentation
├── scripts/                 # Build/stitch scripts
├── __tests__/               # Jest tests
├── .cursor/                 # Cursor AI rules (architecture.mdc, typescript-standards.mdc)
├── App.tsx                  # RN entry (delegates to src/app.tsx)
├── package.json
├── metro.config.js
├── tsconfig.json
└── babel.config.js
```

---

## 2. src/ — Full Folder Structure

```
src/
├── app.tsx                 # Root: runMigrations(), SafeAreaProvider, splash/main flow, RootNavigator
├── di.ts                   # Composition root — single place wiring repos → use cases
│
├── core/                   # Pure business logic (no React, no storage, no I/O)
│   ├── time/               # Day, month, year, life progress; clock; projections
│   │   ├── index.ts
│   │   ├── clock.ts
│   │   ├── day.ts
│   │   ├── month.ts
│   │   ├── year.ts
│   │   ├── life.ts
│   │   └── projections.ts
│   ├── activity/           # Activity blocks, regret projection, intervention
│   │   ├── index.ts
│   │   ├── aggregate.ts
│   │   ├── projectRegret.ts
│   │   └── intervention.ts
│   └── countdown/
│       └── daysLeft.ts
│
├── domain/                 # Ports and use cases (no I/O implementation details)
│   ├── index.ts
│   ├── premium.ts          # Premium feature gating
│   ├── repository/         # Interfaces only (implementations in infrastructure)
│   │   ├── index.ts
│   │   ├── ITimeRepository.ts
│   │   ├── IActivityRepository.ts
│   │   ├── ITaskRepository.ts
│   │   ├── ICountdownRepository.ts
│   │   ├── ICustomCounterRepository.ts
│   │   ├── IMonthlyGoalRepository.ts
│   │   ├── ISubscriptionRepository.ts
│   │   ├── TimeRepository.ts        # (type/alias if any)
│   │   └── SubscriptionRepository.ts
│   ├── ports/              # External service interfaces (adapters in infrastructure)
│   │   ├── IAppUpdateService.ts
│   │   ├── IAppVersionProvider.ts
│   │   ├── IDeviceIdProvider.ts
│   │   └── ILicenseVerificationService.ts
│   └── useCases/           # Orchestration; depend only on repository interfaces + types
│       ├── index.ts
│       ├── ObserveTimeStateUseCase.ts
│       ├── UpdateUserProfileUseCase.ts
│       ├── ObserveSubscriptionUseCase.ts
│       ├── UpdateSubscriptionUseCase.ts
│       ├── LogActivityUseCase.ts
│       ├── GetCategoryTotalsUseCase.ts
│       ├── GetRegretProjectionUseCase.ts
│       ├── GetInterventionStateUseCase.ts
│       ├── SyncWidgetUseCase.ts
│       ├── GetCustomCountersUseCase.ts
│       ├── AddCustomCounterUseCase.ts
│       ├── RemoveCustomCounterUseCase.ts
│       ├── IncrementCustomCounterUseCase.ts
│       ├── ReplaceCustomCountersFromSyncUseCase.ts
│       ├── GetCountdownsUseCase.ts
│       ├── AddCountdownUseCase.ts
│       ├── RemoveCountdownUseCase.ts
│       ├── GetTasksForDayUseCase.ts
│       ├── AddTaskUseCase.ts
│       ├── ToggleTaskUseCase.ts
│       ├── UpdateTaskUseCase.ts
│       ├── RemoveTaskUseCase.ts
│       ├── GetDailyTaskStatsUseCase.ts
│       ├── GetWeeklyTaskStatsUseCase.ts
│       ├── GetMonthlyTaskStatsUseCase.ts
│       ├── ObserveDailyTasksUseCase.ts
│       ├── GetMonthlyGoalsUseCase.ts
│       ├── GetGoalUseCase.ts
│       ├── AddMonthlyGoalUseCase.ts
│       ├── UpdateMonthlyGoalUseCase.ts
│       ├── RemoveMonthlyGoalUseCase.ts
│       ├── AddGoalTaskUseCase.ts
│       ├── UpdateGoalTaskUseCase.ts
│       ├── RemoveGoalTaskUseCase.ts
│       ├── AddToDailyFromGoalUseCase.ts
│       ├── SetRepeatDailyFromGoalUseCase.ts
│       ├── RemoveRepeatDailyFromGoalUseCase.ts
│       ├── IsRepeatDailyUseCase.ts
│       ├── CheckForAppUpdateUseCase.ts
│       ├── GetAppVersionUseCase.ts
│       ├── ActivateLicenseUseCase.ts
│       ├── VerifySubscriptionUseCase.ts
│       └── ... (see src/domain/useCases/ for full list)
│
├── infrastructure/         # Implementations (repos, adapters, widget sync)
│   ├── index.ts            # Re-exports for app entry / WidgetSync usage
│   ├── WidgetSync.ts       # syncWidgetCache(), syncCustomCounters(), syncDailyTasksWidget, etc.
│   ├── AppVersion.ts
│   ├── DeviceId.ts
│   ├── InAppUpdate.ts
│   ├── repositories/
│   │   ├── index.ts
│   │   ├── MmkvTimeRepository.ts
│   │   ├── MmkvSubscriptionRepository.ts
│   │   ├── MmkvActivityRepository.ts
│   │   ├── MmkvCustomCounterRepository.ts
│   │   ├── MmkvCountdownRepository.ts
│   │   ├── MmkvTaskRepository.ts
│   │   └── MmkvMonthlyGoalRepository.ts
│   └── adapters/
│       ├── AppUpdateServiceAdapter.ts
│       ├── AppVersionProviderAdapter.ts
│       ├── DeviceIdProviderAdapter.ts
│       └── LicenseVerificationServiceAdapter.ts
│
├── persistence/            # Storage layer (MMKV only currently)
│   ├── index.ts
│   ├── mmkv.ts             # MMKV instance, getString/setString
│   ├── schema.ts           # STORAGE_KEYS, DEFAULTS (shared with native widgets)
│   └── migration.ts       # runMigrations()
│
├── hooks/                  # React bindings to use cases (no direct repo/core imports)
│   ├── index.ts
│   ├── useObserveTimeState.ts
│   ├── useUpdateUserProfile.ts
│   ├── useObserveSubscription.ts
│   ├── useUpdateSubscription.ts
│   ├── useDailyTasks.ts
│   ├── useLogActivity.ts
│   ├── useObserveCategoryTotals.ts
│   ├── useRegretProjection.ts
│   ├── useInterventionState.ts
│   └── ...
│
├── surfaces/               # UI entry points (screens and widget/Live Activity contracts)
│   ├── app/                # App screens
│   │   ├── index.ts
│   │   ├── HomeScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── LifeScreen.tsx
│   │   ├── WidgetScreen.tsx
│   │   ├── CustomCountersScreen.tsx
│   │   ├── CountdownsScreen.tsx
│   │   ├── DailyTasksScreen.tsx
│   │   ├── TaskReportScreen.tsx
│   │   ├── DayDetailScreen.tsx
│   │   ├── MonthDetailScreen.tsx
│   │   ├── YearDetailScreen.tsx
│   │   ├── MonthlyGoalsScreen.tsx
│   │   ├── GoalDetailScreen.tsx
│   │   ├── HourCalculationScreen.tsx
│   │   ├── DynamicIslandScreen.tsx
│   │   ├── OverlayScreen.tsx
│   │   └── ...
│   ├── splash/
│   │   ├── index.ts
│   │   └── SplashScreen.tsx
│   ├── widgets/
│   │   └── dataContract.ts # Shared types for native widgets (re-exports from types where applicable)
│   ├── island/
│   │   └── dataShape.ts    # Live Activity / Dynamic Island data shape
│   └── overlay/
│       └── index.ts        # Android overlay data shape (if any)
│
├── ui/                     # Reusable presentational components
│   ├── index.ts
│   ├── Text.tsx
│   ├── Card.tsx
│   ├── FAB.tsx
│   ├── ProgressLine.tsx
│   ├── ProgressBar.tsx
│   ├── CircularProgress.tsx
│   ├── DotsGrid.tsx
│   ├── BarChart.tsx
│   ├── PieChart.tsx
│   ├── ScreenGradient.tsx
│   ├── TimeStatement.tsx
│   └── ...
│
├── navigation/
│   └── RootNavigator.tsx   # Stack navigator, screen list, RootStackParamList
│
├── theme/                  # Design system
│   ├── index.ts            # Colors, Typography, Spacing, Radius, Weight, getFontFamilyForWeight
│   └── progressColor.ts    # getProgressColor(progress) — SSOT for progress colors
│
├── types/                  # Global TypeScript types (DTOs)
│   ├── index.ts            # UserProfile, TimeProgress, WidgetCache, DailyTask, etc.
│   └── subscription.ts    # ActivationResult, VerificationResult, SubscriptionState
│
├── platform/               # Native bridges (widgets, Live Activity)
│   ├── index.ts
│   ├── ios/
│   │   └── bridge.ts
│   └── android/
│       └── bridge.ts
│
├── utils/
│   └── index.ts            # Generic helpers (no time/activity logic)
│
└── assets/
    ├── fonts/              # Inter_18pt-*.ttf
    └── images/
        ├── index.tsx       # Asset exports
        └── appLogo.png
```

---

## 3. Architecture Summary

### 3.1 Layered Boundaries

| Layer | Role | Can Import | Must NOT Import |
|-------|------|------------|-----------------|
| **Surfaces (UI)** | Screens, splash, widget contracts | `hooks`, `di`, `ui`, `theme`, `types`, `navigation` | `core`, `persistence`, `domain/repository`, `infrastructure` |
| **Hooks** | React bindings to use cases | `di`, `infrastructure` (only WidgetSync for sync) | `core` directly for business logic |
| **Use Cases** | Orchestration | `domain/repository` (interfaces), `types` | `persistence`, `core` (repos call core) |
| **Repositories** | Data access | `core`, `persistence`, `types` | React, UI |
| **Core** | Pure business logic | Nothing | React, storage, I/O |

### 3.2 Single Source of Truth (SSOT)

| Concern | SSOT Location | Notes |
|---------|----------------|-------|
| Time / profile data | `TimeRepository` (via `MmkvTimeRepository`) | Only place that reads/writes user/time to MMKV |
| Widget cache | `TimeRepository.getWidgetCache()` | Same time logic as `getTimeState()` |
| Progress colors | `theme/progressColor.ts` → `getProgressColor(progress)` | UI consumes; no duplicate logic |
| Types / DTOs | `types/index.ts` | `WidgetCache`, `UserProfile`, `TimeProgress`, etc. |
| Storage keys | `persistence/schema.ts` | Shared with native widgets (Swift/Kotlin) |

### 3.3 Composition Root

- **File:** `src/di.ts`
- All repository and adapter instances are created here.
- Use cases are instantiated with these dependencies and exported.
- App and hooks import use cases from `di` only; they do not instantiate repositories.

### 3.4 Data Flow

1. **Read:** Screen → Hook → Use Case → Repository → MMKV / Core  
2. **Write:** Screen → Hook → Use Case → Repository.setX() → MMKV → subscribe() notifies  
3. **Widget sync:** `syncWidgetCache()` (or similar) → `SyncWidgetUseCase.execute()` → `TimeRepository.getWidgetCache()` → MMKV → native bridge  

---

## 4. Native Folders (High Level)

### android/

- `app/src/main/java/app/until/time/` — Kotlin: MainActivity, WidgetBridgeModule, *WidgetProvider, *Receiver, UNTILOverlayService  
- `app/src/main/res/layout/` — `widget_*.xml`, `overlay_*.xml`  
- `app/src/main/res/drawable/`, `res/values/`, `res/xml/` — resources and widget configs  
- `AndroidManifest.xml`  
- Fonts in `app/src/main/assets/fonts/`  

### ios/

- `UNTIL/` — Main app (AppDelegate, WidgetBridge, LiveActivityBridge, Info.plist)  
- `UNTILWidgets/` — Widget extension (timeline providers, WidgetMMKV, Info.plist)  
- Xcode project and schemes under `UNTIL.xcodeproj/`  

---

## 5. Key Conventions (Refactor-Relevant)

- **Use cases:** `PascalCase` + `UseCase` suffix; one file per use case.  
- **Repository interfaces:** `I` prefix in `domain/repository/`; implementations in `infrastructure/repositories/` with `Mmkv` prefix.  
- **Hooks:** `use` prefix; depend on `di` (use cases), not repositories or core.  
- **Screens:** `PascalCase` + `Screen` suffix in `surfaces/app/`; registered in `RootNavigator.tsx`.  
- **New use case:** Add in `domain/useCases/`, instantiate and export from `di.ts`.  
- **New storage key:** Add to `persistence/schema.ts` (and document if shared with widgets).  

---

## 6. ADRs (Architecture Decision Records)

See `docs/DECISIONS.md` for:

- **ADR-1:** Clean Architecture with SSOT  
- **ADR-2:** Composition root (`di.ts`)  
- **ADR-3:** Use case + hook pattern (no Redux for core)  
- **ADR-4:** MMKV for persistence  
- **ADR-5:** Widget data via same repository logic  
- **ADR-6:** Progress color SSOT  

These should be respected or explicitly changed during refactoring.

---

## 7. Module Counts (Approximate)

| Area | Count |
|------|--------|
| Domain use cases | ~40 |
| Repository interfaces | 7 |
| Mmkv repository implementations | 7 |
| Ports (adapters interfaces) | 4 |
| Adapter implementations | 4 |
| App screens | 16+ |
| Hooks | ~10 |
| Core modules | time (7), activity (4), countdown (1) |

---

## 8. Related Docs

- `docs/FOLDER_STRUCTURE.md` — Conventions and “where to put new code”  
- `docs/DECISIONS.md` — ADRs  
- `docs/WidgetImplementation.md` — Widget implementation details  
- `.cursor/rules/architecture.mdc` — Enforced layer and SSOT rules  

This file is the single handoff document for architecture refactoring; it can be given to an architect alongside the repo and the above references.
