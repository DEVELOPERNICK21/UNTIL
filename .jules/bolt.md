## 2025-05-22 - [Isolating high-frequency state updates]
**Learning:** In React Native, high-frequency state updates (e.g., 1-second timers) in a screen-level component trigger re-renders for the entire component tree, including static or slow-changing components.
**Action:** Isolate these updates into dedicated sub-components and use `React.memo` along with `useCallback` for props to ensure the rest of the screen remains static.

## 2025-05-23 - [Native-driven animations for progress indicators]
**Learning:** Animating layout properties like `width` in React Native is expensive as it requires layout recalculations and cannot use the native driver.
**Action:** Prefer using `transform` properties like `translateX` with `useNativeDriver: true`. For progress bars, translate a full-width fill from `-width` to `0` inside a container with `overflow: 'hidden'`.
