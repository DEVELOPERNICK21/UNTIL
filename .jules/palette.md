## 2025-05-15 - [Accessibility for Time Reality]
**Learning:** In information-dense screens like the Time Reality dashboard, visual summaries (like "XX% passed") are clear for sighted users but need explicit `accessibilityLabel` to be meaningful for screen readers. Icon-only floating action buttons must always have a descriptive `accessibilityLabel` and `accessibilityRole="button"`.
**Action:** Always provide `accessibilityLabel` when using icon-only FABs and ensure container components that represent summarized state have descriptive labels.

## 2025-05-20 - [Centralized Haptics & Adjustable Accessibility]
**Learning:** Centralizing haptic feedback in core UI components (like `Slider.tsx`) ensures a consistent tactile experience across the app and reduces logic duplication in screens. Adding `accessibilityRole="adjustable"` and handling `onAccessibilityAction` for custom sliders enables screen reader users to interact with them using standard platform gestures (like swiping up/down).
**Action:** Integrate haptics directly into reusable interactive components and always implement `adjustable` role for custom sliders/pickers.
