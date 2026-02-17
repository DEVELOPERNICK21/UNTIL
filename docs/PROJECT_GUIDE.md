# UNTIL Project - Complete File & Folder Guide

A reference to understand every folder and file in the project.

---

## 1. CORE – Business Logic (Pure)

**Correct term:** Yes, you can call it **business logic** or **domain logic**. It contains pure functions that compute time-related values.

**Rule:** No React, no storage, no side effects. Given inputs → return outputs.

### Files and Functions

| File | Functions | Purpose |
|------|-----------|---------|
| **clock.ts** | `now()`, `nowMs()`, `startOfDay()`, `endOfDay()`, `startOfMonth()`, `endOfMonth()`, `startOfYear()`, `endOfYear()`, `daysInMonth()`, `daysInYear()`, `isLeapYear()`, `parseDate()` | Time source, date boundaries, DST-safe helpers |
| **day.ts** | `getDayProgress(date)` | Day progress 0–1 |
| **month.ts** | `getMonthProgress(date)` | Month progress 0–1 |
| **year.ts** | `getYearProgress(date)` | Year progress 0–1 |
| **life.ts** | `getLifeProgress(birthDate, deathAge, nowDate)` | Life progress 0–1 |
| **projections.ts** | `projectLifeProgressTimestamp()`, `msUntilNextMidnight()` | Future estimates |

**Example:** `getLifeProgress('1990-01-15', 80, new Date())` → `{ progress: 0.42, yearsLived: 35, ... }`

---

## 2. DOMAIN – Repository & Use Cases

### TimeRepository (Repository)

**Role:** Single source of truth for user and time data. Only place that reads/writes user/time to MMKV.

| Function | What it does | Used by |
|----------|--------------|---------|
| `getUserProfile()` | Reads `birthDate`, `deathAge` from MMKV | Use cases, screens |
| `getTimeState()` | Gets profile, calls core, returns `{ day, week, month, year, life }` | Use cases, screens |
| `setUserProfile(birthDate, deathAge)` | Writes to MMKV, notifies subscribers | UpdateUserProfileUseCase |
| `subscribe(callback)` | Registers callback; callbacks run when profile changes. Returns unsubscribe | useObserveTimeState hook |

**Why it exists:** Centralizes all user/time reads and writes. Screens and widgets never touch MMKV directly.

---

### ObserveTimeStateUseCase

**Role:** Encapsulates "get current user + time state and react to changes."

| Function | What it does |
|----------|--------------|
| `observe()` | Returns `{ userProfile, timeState }` from TimeRepository |
| `subscribe(callback)` | Forwards to TimeRepository.subscribe() |

**Why it exists:** One place to define how we observe time state. UI calls this use case instead of the repository.

---

### UpdateUserProfileUseCase

**Role:** Encapsulates "save user profile."

| Function | What it does |
|----------|--------------|
| `execute(birthDate, deathAge)` | Calls `TimeRepository.setUserProfile()` |

**Why it exists:** One place to define profile updates. Later you can add validation, analytics, etc.

---

## 3. HOOKS – React ↔ Use Cases

**Why observe?** React needs to re-render when data changes. The repository has no React. Hooks connect React (state) to the repository (data).

### useObserveTimeState

- **What:** Subscribes to TimeRepository and polls every 60s.
- **Why:** Time (day/month/year/life) changes every second; we don’t want to poll every second. We subscribe for profile changes and poll for time.
- **Returns:** `{ userProfile, timeState }`
- **Used by:** HomeScreen, SettingsScreen

### useUpdateUserProfile

- **What:** Returns `updateUserProfile(birthDate, deathAge)` that calls the use case.
- **Why:** Centralizes profile updates; when profile changes, `subscribe` callbacks run and `useObserveTimeState` re-renders.

---

## 4. NAVIGATION

**Current role:** Defines screens and routes (Home, Settings).

**Possible improvements:**
- Deep linking (open specific screen from URL)
- Auth flow (redirect if not onboarded)
- Type-safe params with `RootStackParamList`
- Tab navigator or drawer if you add more sections

---

## 5. PERSISTENCE – Data Layer

| File | Role |
|------|------|
| **mmkv.ts** | MMKV instance, `getString`, `setString`, `getNumber`, `setNumber`, etc. |
| **schema.ts** | Keys (`user.birthDate`, `user.deathAge`), defaults, types |
| **migration.ts** | Versioned migrations; upgrades old data safely |

**Schema:** Defines how data is stored. Same keys are used by native widgets.

**Migration:** When you change schema (e.g. rename a key), add a new migration version. Old installs run migrations; new installs start with the latest.

---

## 6. PLATFORM – Native Bridge

**Role:** JS interface to native modules (widgets, Live Activity, Dynamic Island).

- **platform/index.ts:** `platformBridge` (`startActivity`, `updateActivity`, `endActivity`), `isIOS`, `isAndroid`
- **ios/bridge.ts, android/bridge.ts:** Platform-specific wrappers (placeholders for now)

**Flow:** App calls `platformBridge.startActivity({ ... })` → native module runs Swift/Kotlin code.

---

## 7. REDUX – State Management

**Current use:** Premium state only (`isPremium`).

| File | Role |
|------|------|
| **store.ts** | Root store with `premium` reducer |
| **slices/premium.slice.ts** | `setPremium(true/false)` |
| **middleware/mmkvSync.ts** | Placeholder for syncing premium to MMKV later |

**Flow:** `dispatch(setPremium(true))` → reducer updates state → any `useAppSelector(s => s.premium.isPremium)` re-renders.

**Note:** User and time are not in Redux; they go through TimeRepository.

---

## 8. SURFACES – Screens (UI)

| Folder | Role |
|--------|------|
| **app/** | Main app screens (HomeScreen, SettingsScreen) |
| **widgets/** | Shared data contracts for native widgets |
| **island/** | Live Activity / Dynamic Island data shapes |
| **overlay/** | Lock screen (placeholder) |

**Screens:** Full screens that use hooks and render UI. They read from use cases, never from storage directly.

---

## 9. UI – Reusable Components

**Role:** Dumb components. Receive props, render. No Redux, no repository, no business logic.

| Component | Props | Purpose |
|-----------|-------|---------|
| **Text** | `variant`, `style` | Styled text |
| **ProgressBar** | `progress`, `height`, `color` | Progress 0–1 |
| **DotsGrid** | `rows`, `cols`, `fillCount`, `size`, `gap` | Grid of dots |

---

## 10. UTILS – Generic Helpers

**Role:** Small helpers that are **not** time or business logic.

**Rule:** No time math, no domain logic. Pure, generic utilities.

**Examples:**
- `formatNumber(1234)` → `"1,234"`
- `clamp(value, min, max)`
- `debounce(fn, ms)`
- `sleep(ms)` for tests

Currently empty; add as needed.

---

## 11. TYPES – TypeScript Types

**Role:** Shared interfaces and types for the whole app.

| Type | Purpose |
|------|---------|
| `ThemeMode` | 'light' \| 'dark' \| 'system' |
| `UserProfile` | birthDate, deathAge |
| `TimeProgress` | day, week, month, year, life (0–1) |
| `DayProgress`, `MonthProgress`, etc. | Detailed progress structures |

---

## 12. APP ENTRY

**app.tsx:**
1. Runs migrations
2. Wraps app in Redux Provider + SafeAreaProvider
3. Renders RootNavigator

---

## Quick Reference Table

| Folder | One-line description |
|--------|----------------------|
| **core** | Pure business logic (time math) |
| **domain** | Repository (SSOT) + use cases (orchestration) |
| **hooks** | React bindings to use cases |
| **navigation** | Screen routing |
| **persistence** | MMKV, schema, migrations |
| **platform** | Native module bridge |
| **redux** | Premium state only |
| **surfaces** | Screens |
| **ui** | Reusable UI components |
| **utils** | Generic helpers (no domain logic) |
| **types** | Shared TypeScript types |
| **theme** | Colors, spacing, typography |
