## 2025-05-15 - [HomeScreen Timer Isolation]
**Learning:** High-frequency state updates (1Hz) at the root of a complex screen cause massive unnecessary re-renders of stable UI components and hooks.
**Action:** Always isolate ticking timers or high-frequency input states into leaf components and use `React.memo` for siblings to preserve CPU cycles.
