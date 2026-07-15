## 2025-05-15 - Isolating High-Frequency State Updates
**Learning:** In React Native, having a high-frequency (e.g. 1-second) timer at the screen level causes the entire screen and all its children to re-render every second. This is especially expensive when children perform complex calculations or have their own animations.
**Action:** Isolate high-frequency state updates into dedicated, memoized sub-components. This ensures only the necessary parts of the UI re-render, significantly reducing the main thread load.

## 2026-07-15 - Optimizing Shell Components for Live Data
**Learning:** Shell components (like `PeriodDetailScreen`) often wrap complex UI that shouldn't re-render frequently. When these shells display "live" data (e.g. 1-second timers), passing the data as strings from the parent forces the shell to re-render.
**Action:** Update shell component props to accept `React.ReactNode` for live labels. This allows passing a memoized "live" component that handles its own timer, keeping the shell and other static siblings from re-rendering.
