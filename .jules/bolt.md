## 2025-05-15 - Isolating High-Frequency State Updates
**Learning:** In React Native, having a high-frequency (e.g. 1-second) timer at the screen level causes the entire screen and all its children to re-render every second. This is especially expensive when children perform complex calculations or have their own animations.
**Action:** Isolate high-frequency state updates into dedicated, memoized sub-components. This ensures only the necessary parts of the UI re-render, significantly reducing the main thread load.

## 2026-06-24 - Native Driver Animations & Render Isolation
**Learning:** Animating 'width' in React Native causes layout recalculations on every frame on the JS thread. Offloading these to the UI thread using 'useNativeDriver: true' and 'transform: [{ translateX }]' significantly improves smoothness. Combined with memoized component isolation for high-frequency (1s) timers, this eliminates main-thread "jitter" in time-heavy dashboards.
**Action:** Always prefer 'translateX' over 'width' for progress indicators and isolate high-frequency state into dedicated sub-components.
