## 2025-05-15 - Isolating High-Frequency State Updates
**Learning:** In React Native, having a high-frequency (e.g. 1-second) timer at the screen level causes the entire screen and all its children to re-render every second. This is especially expensive when children perform complex calculations or have their own animations.
**Action:** Isolate high-frequency state updates into dedicated, memoized sub-components. This ensures only the necessary parts of the UI re-render, significantly reducing the main thread load.
