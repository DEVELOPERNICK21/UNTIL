## 2025-05-15 - [HomeScreen Performance Optimization]
**Learning:** High-frequency timers (like a 1-second clock) in a parent component cause the entire subtree to re-render every tick, even if children are memoized, unless the state is strictly isolated.
**Action:** Isolate high-frequency state updates into dedicated, memoized sub-components to prevent unnecessary re-renders of the parent and sibling components.
