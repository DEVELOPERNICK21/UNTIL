# UNTIL — Folder Structure

This document describes the directory layout and conventions for scalability and maintainability.

---

## Root Layout

```
UNTIL/
├── src/                    # React Native app source
├── android/                # Android native (Kotlin, layouts, manifests)
├── ios/                    # iOS native (Swift, Xcode project)
├── website/                # Marketing website (Next.js)
├── docs/                   # Project documentation
├── __tests__/              # Jest tests
└── .cursor/                # Cursor AI rules and system context
```

---

## src/ Structure

```
src/
├── app.tsx                 # Root: migrations, SafeAreaProvider, navigation
├── di.ts                   # Composition root — wire repos → use cases (single place)
│
├── core/                   # Pure business logic (no React, no storage)
│   ├── time/               # Day, month, year, life progress; clock; projections
│   ├── activity/           # Activity blocks, regret projection, intervention
│   └── countdown/          # Days-left calculations
│
├── domain/                 # Ports and use cases (no I/O details)
│   ├── repository/         # Interfaces: ITimeRepository, IActivityRepository, etc.
│   ├── ports/              # External service interfaces (IAppUpdateService, IAppVersionProvider)
│   └── useCases/           # Orchestration: ObserveTimeStateUseCase, UpdateUserProfileUseCase, etc.
│
├── infrastructure/         # Implementations
│   ├── repositories/      # MmkvTimeRepository, MmkvTaskRepository, etc.
│   ├── adapters/           # AppUpdateServiceAdapter, AppVersionProviderAdapter
│   ├── WidgetSync.ts       # syncWidgetCache, syncCustomCounters, syncDailyTasksWidget, etc.
│   └── index.ts            # Re-exports for app entry
│
├── persistence/            # Storage layer
│   ├── mmkv.ts             # MMKV instance, getString/setString
│   ├── schema.ts           # STORAGE_KEYS, DEFAULTS (shared with widgets)
│   └── migration.ts        # runMigrations()
│
├── hooks/                  # React bindings to use cases
│   ├── useObserveTimeState.ts
│   ├── useUpdateUserProfile.ts
│   ├── useDailyTasks.ts
│   └── ...
│
├── surfaces/               # UI entry points
│   ├── app/                # App screens (HomeScreen, SettingsScreen, etc.)
│   ├── widgets/            # dataContract.ts — shared types for native widgets
│   ├── island/             # dataShape.ts — Live Activity / Dynamic Island
│   └── overlay/            # Android overlay data shape (if any)
│
├── ui/                     # Reusable presentational components
│   ├── Text.tsx
│   ├── Card.tsx
│   ├── ProgressLine.tsx
│   ├── CircularProgress.tsx
│   └── ...
│
├── navigation/
│   └── RootNavigator.tsx   # Stack navigator, screen list
│
├── theme/                  # Design system
│   ├── index.ts            # Colors, Typography, Spacing, Radius
│   └── progressColor.ts    # getProgressColor(progress) — SSOT for progress colors
│
├── types/                  # Global TypeScript types (DTOs)
│   └── index.ts            # UserProfile, TimeProgress, WidgetCache, DailyTask, etc.
│
├── platform/               # Native bridges (widgets, Live Activity)
│   ├── ios/bridge.ts
│   └── android/bridge.ts
│
├── utils/                  # Generic helpers (no time/activity logic)
└── assets/                 # Fonts, icons, images
```

---

## Conventions

### Where to Put New Code

| Task | Location |
|------|----------|
| New time metric | `core/time/*.ts` |
| New use case | `domain/useCases/XxxUseCase.ts` + wire in `di.ts` |
| New hook | `hooks/useXxx.ts` |
| New screen | `surfaces/app/XxxScreen.tsx` + add to `RootNavigator` |
| New reusable component | `ui/Xxx.tsx` |
| New storage key | `persistence/schema.ts` |
| New type | `types/index.ts` |
| New widget | See `docs/WIDGETS.md` — provider, layout, manifest, worker |

### File Naming

- **Use cases**: `PascalCase` + `UseCase` suffix (e.g. `ObserveTimeStateUseCase.ts`)
- **Repositories**: `I` prefix for interfaces, `Mmkv` prefix for MMKV impl
- **Hooks**: `use` prefix (e.g. `useObserveTimeState.ts`)
- **Screens**: `PascalCase` + `Screen` suffix (e.g. `HomeScreen.tsx`)
- **Components**: `PascalCase` (e.g. `Text.tsx`, `ProgressLine.tsx`)

### Index Files

- `hooks/index.ts` — re-exports all hooks
- `ui/index.ts` — re-exports UI components
- `infrastructure/index.ts` — re-exports sync functions, etc.
- `domain/useCases/index.ts` — re-exports use cases (for di imports)

---

## Native Folders

### android/

```
android/app/src/main/
├── java/app/until/time/     # Kotlin: MainActivity, WidgetBridgeModule, *WidgetProvider, *Receiver
├── res/
│   ├── layout/              # widget_*.xml, overlay_*.xml
│   ├── drawable/            # overlay backgrounds, etc.
│   ├── values/strings.xml
│   └── xml/                 # widget_*_info.xml (widget configs)
└── AndroidManifest.xml
```

### ios/

```
ios/
├── UNTIL/                   # Main app target
│   ├── AppDelegate.swift
│   ├── WidgetBridge.swift   # Native module for RN
│   ├── LiveActivityBridge.swift
│   └── Info.plist
└── UNTILWidgets/            # Widget extension
    ├── UNTILWidgets.swift   # Timeline providers, widget views
    ├── WidgetMMKV.swift    # App Group MMKV access
    └── Info.plist
```

---

## Scalability Notes

- **Adding a new surface** (e.g. watchOS): Reuse `TimeRepository`, read same MMKV keys; add new `surfaces/watch/` and platform bridge.
- **Adding a new domain** (e.g. notes): Add `core/notes/`, `domain/repository/INoteRepository.ts`, `domain/useCases/*`, `infrastructure/repositories/MmkvNoteRepository.ts`, wire in `di.ts`.
- **Swapping persistence**: Change only repository implementations; interfaces and use cases stay the same.
