## 2025-05-15 - Isolating High-Frequency State Updates
**Learning:** In React Native, having a high-frequency (e.g. 1-second) timer at the screen level causes the entire screen and all its children to re-render every second. This is especially expensive when children perform complex calculations or have their own animations.
**Action:** Isolate high-frequency state updates into dedicated, memoized sub-components. This ensures only the necessary parts of the UI re-render, significantly reducing the main thread load.

## 2025-05-16 - Stabilizing Event Handlers with Refs
**Learning:** When a screen has both a high-frequency timer (isolated in a child) and user input (e.g. a `TextInput`), typing in the input can still cause the "memoized" child to re-render if the event handlers passed to it (like `onReset`) depend on the input state.
**Action:** Use a `useRef` to track the input value and reference it inside `useCallback` handlers. This keeps the handlers stable across keystrokes, truly isolating the input-driven re-renders from the rest of the component tree.
