## 2026-05-27 - Isolate High-Frequency Timer
**Learning:** React Native screens with 1-second timers (e.g., clocks, progress bars) will re-render the entire screen and all its hooks every second if the timer state is at the screen level. This wastes CPU and can cause UI stutter.
**Action:** Push high-frequency state updates down into dedicated leaf components. Use `React.memo` on sibling components to prevent them from re-rendering when the parent does re-render at a lower frequency (e.g., on a 60-second store sync).
