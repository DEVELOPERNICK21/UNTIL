## 2025-05-15 - Isolating High-Frequency State Updates
**Learning:** In React Native, having a high-frequency (e.g. 1-second) timer at the screen level causes the entire screen and all its children to re-render every second. This is especially expensive when children perform complex calculations or have their own animations.
**Action:** Isolate high-frequency state updates into dedicated, memoized sub-components. This ensures only the necessary parts of the UI re-render, significantly reducing the main thread load.

## 2025-05-16 - Selective Memoization of Heavy SVG Components vs Containers
**Learning:** Wrapping container components that accept `children` (e.g., `Card`, `GlassCard`) with standard `React.memo` is an anti-pattern because inline JSX children create new object references on every render, causing shallow comparisons to always fail. Conversely, memoizing leaf data visualization components (`BarChart`, `PieChart`) that do heavy SVG/trigonometric path calculations eliminates re-computations when parent views re-render with stable data props.
**Action:** Focus `React.memo` on heavy leaf components with stable props rather than container components that receive dynamic `children`.
