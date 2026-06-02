## 2025-05-22 - [Isolating high-frequency state updates]
**Learning:** In React Native, high-frequency state updates (e.g., 1-second timers) in a screen-level component trigger re-renders for the entire component tree, including static or slow-changing components.
**Action:** Isolate these updates into dedicated sub-components and use `React.memo` along with `useCallback` for props to ensure the rest of the screen remains static.

## 2026-06-02 - [Native UI Thread Animations for Progress Bars]
**Learning:** Animating 'width' for progress bars is expensive as it triggers layout recalculations on the JavaScript thread. Using 'translateX' with 'useNativeDriver: true' offloads the animation to the native thread.
**Action:** Implement progress animations by placing a full-width bar inside a container with 'overflow: hidden' and translating it from -width to 0.
