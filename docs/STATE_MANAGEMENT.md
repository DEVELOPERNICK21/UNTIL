# UNTIL — State Management

How state is managed across the app: use cases, hooks, subscriptions, and local UI state.

---

## Overview

UNTIL uses a **use case + hook** pattern for application state. There is no global Redux store for core flows. Data flows:

1. **Repository** (MMKV-backed) holds persisted data
2. **Use case** orchestrates reads/writes and exposes `observe()` / `subscribe()`
3. **Hook** subscribes to use case, holds React state, returns data to UI
4. **Screen** uses hook; no direct repository or use case access

---

## Patterns

### Observable Data (Time, Tasks, Counters)

For data that changes (repository updates, time progression):

```typescript
// Use case: observe() + subscribe()
export class ObserveTimeStateUseCase {
  observe(): TimeStateResult { ... }
  subscribe(callback: () => void): () => void { ... }
}

// Hook: useState + useEffect + subscribe
export function useObserveTimeState() {
  const [state, setState] = useState(() => observeTimeStateUseCase.observe());
  const refresh = useCallback(() => {
    setState(observeTimeStateUseCase.observe());
    syncWidgetCache(); // if widgets need update
  }, []);
  useEffect(() => {
    const unsub = observeTimeStateUseCase.subscribe(refresh);
    const interval = setInterval(refresh, POLL_INTERVAL_MS); // for time
    return () => { unsub(); clearInterval(interval); };
  }, [refresh]);
  return state;
}
```

### One-Shot Reads

For data that doesn't need live updates:

```typescript
// Hook
export function useCountdowns() {
  const [countdowns, setCountdowns] = useState(() => getCountdownsUseCase.execute());
  const refresh = useCallback(() => {
    setCountdowns(getCountdownsUseCase.execute());
    syncCountdowns();
  }, []);
  return { countdowns, refresh };
}
```

### Mutations

Mutations go through use cases:

```typescript
// Hook returns mutator
export function useUpdateUserProfile() {
  return useCallback((birthDate: string, deathAge: number) => {
    updateUserProfileUseCase.execute(birthDate, deathAge);
    syncWidgetCache();
  }, []);
}
```

Repository `setX()` writes to MMKV and calls `subscribe` callbacks, so hooks that subscribed will re-run and update UI.

---

## Local UI State

Use `useState` for:

- Form inputs (birth date, death age, new task title)
- Modal visibility
- Selected tab/period
- Loading/error flags for async operations

```typescript
const [modalVisible, setModalVisible] = useState(false);
const [birthInput, setBirthInput] = useState(userProfile.birthDate ?? '');
```

---

## Widget Sync

When app data changes, sync to native widgets:

- `syncWidgetCache()` — time progress
- `syncCustomCounters()` — counter widget
- `syncCountdowns()` — countdown widget
- `syncDailyTasksWidget()` — daily tasks widget
- `updateLiveActivity()` — iOS Live Activity
- `updateOverlay()` — Android overlay

Hooks that mutate data should call the appropriate sync after the use case executes.

---

## Redux (Optional)

`@reduxjs/toolkit` and `react-redux` are in dependencies but **not used** for core flows. Reserved for:

- Premium/subscription state (if needed)
- Cross-screen shared UI state that doesn't fit the repository model

If adding Redux: create `redux/store.ts`, slices, and wrap app with `Provider` in `app.tsx`. Keep business data in repositories; Redux for UI-only state.

---

## Summary

| State Type | Solution |
|------------|----------|
| Time, profile, tasks, counters | Use case + hook with subscribe |
| Form inputs, modals | `useState` in component |
| Widget data | Repository → sync functions → MMKV → native |
| Premium (future) | Redux slice + MMKV sync middleware |
