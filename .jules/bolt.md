## 2025-05-14 - Isolate high-frequency re-renders in HomeScreen
**Learning:** High-frequency timers (e.g., 1s updates for "Today" progress) in a parent component cause the entire tree to re-render, even if other components only depend on low-frequency data (e.g., 1m updates).
**Action:** Move high-frequency state into dedicated, memoized sub-components to isolate re-renders and use `useMemo`/`useCallback` to stabilize props for other memoized children.
