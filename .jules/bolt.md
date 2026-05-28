## 2025-05-22 - [Isolating high-frequency state updates]
**Learning:** In React Native, high-frequency state updates (e.g., 1-second timers) in a screen-level component trigger re-renders for the entire component tree, including static or slow-changing components.
**Action:** Isolate these updates into dedicated sub-components and use `React.memo` along with `useCallback` for props to ensure the rest of the screen remains static.

## 2026-05-28 - [Native Driver for Smooth Animations]
**Learning:** Animating layout properties like `width` in React Native cannot use the native driver, forcing animations to run on the JS thread, which can lead to stutters during heavy JS work.
**Action:** Refactor layout animations to use `transform` properties (like `translateX`) and `useNativeDriver: true` to offload work to the native UI thread.
