## 2025-05-15 - Isolating High-Frequency State Updates
**Learning:** In React Native, having a high-frequency (e.g. 1-second) timer at the screen level causes the entire screen and all its children to re-render every second. This is especially expensive when children perform complex calculations or have their own animations.
**Action:** Isolate high-frequency state updates into dedicated, memoized sub-components. This ensures only the necessary parts of the UI re-render, significantly reducing the main thread load.

## 2025-05-16 - High-Performance Progress Animations
**Learning:** Using `useNativeDriver: true` in React Native requires animating non-layout properties like `transform`. For progress bars, animating `width` is a common bottleneck because it runs on the JS thread and triggers layout passes. Switching to `translateX` on a full-width fill inside an `overflow: 'hidden'` track offloads the animation to the native thread.
**Action:** Always prefer `translateX` over `width` for progress animations. If a thumb/dot is present, move it to a separate absolutely positioned `Animated.View` outside the clipping track to prevent it from being hidden at the ends.
