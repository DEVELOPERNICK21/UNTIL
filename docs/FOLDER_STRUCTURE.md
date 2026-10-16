# UNTIL — Folder Structure

Where code lives, how it is named, and where new code goes. The rules behind the layout are in `ARCHITECTURE.md`; the decisions in `DECISIONS.md` (ADR-11 onward).

---

## Repository root

```
UNTIL/
├── src/            React Native app (phone and tablet)
├── desktop/        Tauri desktop app (macOS, Windows); imports pure code from src/ as @until/*
├── website/        Marketing site and desktop update API (Next.js)
├── android/ ios/   Native projects (widgets, Live Activity, watch)
├── __tests__/      Jest tests (architecture guard, domain, desktop, UI)
├── docs/           Documentation
├── .cursor/rules/  Rules for AI agents (mirror these docs)
└── App.tsx         Entry: renders src/app/App
```

---

## src/

```
src/
├── app/                    # Composition root and app shell. May import every feature.
│   ├── App.tsx             #   providers, bootstrap hooks, navigation container
│   ├── AppEngagementLayer.tsx   # shell: navigator + post-onboarding modals + Ember
│   ├── CrashErrorBoundary.tsx
│   ├── bootstrap/          #   start-up hooks that join several features
│   ├── di/                 #   composition root, one file per feature
│   │   ├── index.ts        #     barrel: the names hooks import
│   │   ├── repositories.ts #     every repository and adapter instance
│   │   ├── callbacks.ts    #     cross-cutting reactions (premium changed → refresh widgets)
│   │   ├── <feature>.ts    #     that feature's use cases
│   │   └── wiring.ts       #     start-up configuration of modules that must not import di
│   ├── navigation/         #   navigators, deep links, screen-view analytics
│   └── splash/
│
├── features/               # One folder per product capability
│   └── <feature>/
│       ├── domain/         #   pure: rules, entities, ports, useCases/        (+ index.ts, the domain entry)
│       ├── data/           #   port implementations: Mmkv*Repository, SDK adapters
│       ├── services/       #   helpers screens may call; own their storage keys
│       ├── hooks/          #   React bindings; import use cases from app/di
│       ├── ui/             #   screens and components
│       ├── config/         #   feature-private constants (optional)
│       └── index.ts        #   public API
│
├── shared/                 # Kernel: knows no feature
│   ├── time/               #   day/month/year/life math, clock, panel model
│   ├── theme/              #   palettes, tokens, ThemeContext, progressColor
│   ├── ui/                 #   design-system components (Text, Card, ProgressRing, Ember, …)
│   ├── types/              #   DTOs: UserProfile, TimeProgress, WidgetCache, …
│   ├── persistence/        #   MMKV wrapper, STORAGE_KEYS schema, migrations
│   ├── platform/           #   native bridges, device id, widget-sync port, notification permission
│   ├── analytics/          #   analytics client, consent, user properties
│   ├── navigation/         #   route param lists, root navigation ref
│   ├── hooks/              #   useTodayIso, useLifeWeeks
│   ├── featureFlags/
│   ├── ports/              #   interfaces several features implement or use (IDeviceIdProvider)
│   └── utils/
│
├── config/                 # App-wide constants and environment: monetization, accessConstants,
│                           #   billing, revenueCat, storeUrls, analytics (+ gitignored analytics.local.ts)
└── assets/                 # Fonts, icons, images
```

### The features

| Feature | What it owns |
|---------|--------------|
| `time` | Profile (birth date, expected age), day/month/year/life state, detail screens |
| `presence` | The daily presence streak, streak flame, streak notifications, the day-widget "appeal" |
| `tasks` | Daily tasks, monthly goals, carry-over, task report |
| `countdowns`, `counters` | Countdowns; custom counters |
| `activity` | Activity log, regret projection, "do nothing" limit, intervention, hour calculation |
| `badges` | Badge catalogue, evaluation, quests, unlock overlay |
| `reflections` | Daily reflection and the time-coach card |
| `onboarding` | Funnel state, quiz answers, onboarding screens, day-2 re-engagement |
| `account` | Sign-in (Apple, Google, email), devices, age gate, cloud profile |
| `premium` | Subscription, purchases (RevenueCat), trial preview, licences, access rules, paywall |
| `engagement` | App-open side effects, in-app review, coach prompts, retention notifications |
| `ember` | The Ember companion (tips, memory, docking) |
| `widgets` | Home-screen widgets, Dynamic Island, overlay, widget sync to native |
| `life` | The Life screen |
| `home`, `settings`, `share` | Screens that compose other features |
| `app-update` | Update checks and the force/optional update modals |

---

## Naming

| Kind | Convention | Example |
|------|------------|---------|
| Use case | `XxxUseCase` in `domain/useCases/` | `ObserveTimeStateUseCase` |
| Port | `IXxx` in `domain/ports/` | `ITimeRepository` |
| Implementation | `MmkvXxxRepository`, `XxxAdapter` in `data/` | `MmkvTimeRepository` |
| Hook | `useXxx` in `hooks/` | `useObserveTimeState` |
| Screen | `XxxScreen` in `ui/` | `HomeScreen` |
| Component | `PascalCase.tsx` | `ProgressLine` |
| DI section | `app/di/<feature>.ts` | `app/di/tasks.ts` |

One component, hook or use case per file. Keep files under ~300 lines (ratcheted: see `LEGACY_OVERSIZE` in `__tests__/architecture.test.ts`).

---

## Where does new code go?

1. **Which feature owns it?** Put it there. If two features need it and it knows nothing about either, it belongs in `shared/`. If it is a decision about how features cooperate, it belongs in `app/`.
2. **Which layer?** Pure rule → `domain`. Storage or SDK → `data`. A screen-callable helper that owns its own keys → `services`. React state over a use case → `hooks`. Rendering → `ui`.
3. **Does another feature need it?** Export it from the public API on purpose (`index.ts`, or `domain/index.ts` if it is pure and used by another feature's domain/data/services). Otherwise leave it private.
4. **Does it need a feature that is not in the dependency table?** Prefer inverting the dependency (declare a narrow port in the lower feature, implement it in `app/di`). Add a table row only when the dependency is genuinely one-way and natural.

### Adding a feature

1. `src/features/<name>/{domain,data,hooks,ui}` and an `index.ts`.
2. A row in `FEATURE_DEPENDENCIES` (`__tests__/architecture.test.ts`) and in the table in `ARCHITECTURE.md`.
3. A section `app/di/<name>.ts`, exported from `app/di/index.ts`.
4. Screens registered in `app/navigation/`; route params in `shared/navigation/types.ts`.

### Adding a use case

1. Port (if new) in `domain/ports/`, class in `domain/useCases/`.
2. Implementation in `data/`.
3. Instance in `app/di/<feature>.ts`, exported from `app/di/index.ts`.
4. Hook in `hooks/` that imports the instance from `app/di`.

---

## Layer responsibilities

| Layer | Responsibility | Must not |
|-------|----------------|----------|
| `ui` | Display, capture input | Import `data`, storage, `app/di`, use-case classes, pure domain logic |
| `hooks` | React bindings to use cases | Import storage or repositories |
| `services` | Screen-callable helpers, own storage keys | Import `app/di` |
| `domain` | Rules, ports, use cases | Import React, packages, `data`, `hooks`, `services`, `ui`, `app` |
| `data` | Port implementations | Import `app/di` |
| `shared` | Kernel | Import `features/`, `app/` |
| `app` | Wiring, navigation, shell | — |

`.eslintrc.js` enforces the layer table; `__tests__/architecture.test.ts` enforces the feature-level rules.

---

## Independence

See the table in `ARCHITECTURE.md`. In short: a feature can be removed, rewritten or swapped (MMKV → SQLite, one analytics vendor → another) by touching its folder, its `app/di` section and its row in the dependency table.
