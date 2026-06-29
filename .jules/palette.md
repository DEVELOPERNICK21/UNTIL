## 2025-05-15 - [Accessibility for Time Reality]
**Learning:** In information-dense screens like the Time Reality dashboard, visual summaries (like "XX% passed") are clear for sighted users but need explicit `accessibilityLabel` to be meaningful for screen readers. Icon-only floating action buttons must always have a descriptive `accessibilityLabel` and `accessibilityRole="button"`.
**Action:** Always provide `accessibilityLabel` when using icon-only FABs and ensure container components that represent summarized state have descriptive labels.

## 2025-05-16 - [Haptic and Screen Reader Support for Custom Sliders]
**Learning:** Custom adjustable components like `Slider.tsx` must implement `accessibilityRole="adjustable"`, `accessibilityValue` (min, max, now), and `onAccessibilityAction` (increment/decrement) to be usable by screen readers. Integrating haptic feedback (`Vibration.vibrate`) directly into the component's value-change logic ensures a consistent tactile experience across the app.
**Action:** Always wrap custom interactive components with appropriate accessibility roles and actions. Centralize haptic feedback within shared UI components rather than duplicating it in individual screens.
