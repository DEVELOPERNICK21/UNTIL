## 2025-05-15 - Isolating High-Frequency State Updates
**Learning:** In React Native, having a high-frequency (e.g. 1-second) timer at the screen level causes the entire screen and all its children to re-render every second. This is especially expensive when children perform complex calculations or have their own animations.
**Action:** Isolate high-frequency state updates into dedicated, memoized sub-components. This ensures only the necessary parts of the UI re-render, significantly reducing the main thread load.

## 2025-05-15 - Native Driver and Transform Performance
**Learning:** React Native animations using 'width' or other layout properties are forced onto the JavaScript thread, causing performance drops if the thread is busy. Using 'useNativeDriver: true' with 'transform' (like 'translateX') offloads the animation to the UI thread.
**Action:** Always prefer 'transform' and 'useNativeDriver: true' for progress-like animations. For fill bars, this often involves translating a full-width fill from '-100%' to '0%' inside a container with 'overflow: hidden'.
